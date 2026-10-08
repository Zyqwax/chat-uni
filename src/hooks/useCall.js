import { useEffect, useRef, useState } from "react";
import { addDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { ICE, roomPeers, signalItems } from "../lib/firebase";

/**
 * WebRTC görüşme mantığı. Fonksiyonlar yalnızca ref'lere dayanır; böylece
 * dinleyicilerde eski (stale) state kullanma sorunu olmaz.
 */
export function useCall(me, roomId, onError) {
  const [inCall, setInCall] = useState(false);
  const [withVideo, setWithVideo] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState([]); // görüşmedeki diğer kişiler
  const [remoteStreams, setRemoteStreams] = useState({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const pcs = useRef(new Map());
  const localRef = useRef(null);
  const peersRef = useRef([]);
  const inCallRef = useRef(false);
  const meRef = useRef(me);
  const roomRef = useRef(roomId);
  meRef.current = me;
  roomRef.current = roomId;

  function setPresence(patch) {
    const m = meRef.current;
    if (!m) return Promise.resolve();
    return setDoc(
      doc(roomPeers(roomRef.current), m.uid),
      { name: m.name, session: m.session, ...patch, updated: serverTimestamp() },
      { merge: true },
    );
  }

  function sendSignal(to, data) {
    const m = meRef.current;
    if (!m) return Promise.resolve();
    return addDoc(signalItems(roomRef.current, to), { from: m.uid, ...data, ts: Date.now() });
  }

  function closePC(pid) {
    const pc = pcs.current.get(pid);
    if (!pc) return;
    pcs.current.delete(pid);
    pc.close();
    setRemoteStreams((prev) => {
      const copy = { ...prev };
      delete copy[pid];
      return copy;
    });
  }

  function getPC(pid) {
    if (pcs.current.has(pid)) return pcs.current.get(pid);

    const pc = new RTCPeerConnection(ICE);
    pcs.current.set(pid, pc);

    const local = localRef.current;
    if (local) {
      local.getTracks().forEach((track) => pc.addTrack(track, local));
    } else {
      pc.addTransceiver("audio", { direction: "recvonly" });
      pc.addTransceiver("video", { direction: "recvonly" });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal(pid, { type: "candidate", candidate: e.candidate.toJSON() }).catch(() => {});
    };

    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (stream) setRemoteStreams((prev) => ({ ...prev, [pid]: stream }));
    };

    pc.onconnectionstatechange = () => {
      if (["failed", "closed"].includes(pc.connectionState)) {
        closePC(pid);
        window.setTimeout(() => {
          if (inCallRef.current) syncPeers();
        }, 1000);
      }
    };

    return pc;
  }

  async function makeOffer(pid, options) {
    const pc = getPC(pid);
    const offer = await pc.createOffer(options);
    await pc.setLocalDescription(offer);
    await sendSignal(pid, { type: "offer", sdp: { type: offer.type, sdp: offer.sdp } });
  }

  /** Odadaki kişilerle bağlantıları eşitle: eksik olanlara teklif gönder, gidenleri kapat. */
  function syncPeers() {
    const m = meRef.current;
    if (!m || !inCallRef.current) return;

    const active = peersRef.current.filter((p) => p.id !== m.uid && p.inCall);

    for (const peer of active) {
      // Çakışmayı önlemek için yalnızca uid'si küçük olan teklif gönderir.
      if (!pcs.current.has(peer.id) && m.uid < peer.id) makeOffer(peer.id).catch(console.warn);
    }

    for (const id of [...pcs.current.keys()]) {
      const rec = peersRef.current.find((p) => p.id === id);
      if (rec && !rec.inCall) closePC(id);
    }
  }

  // Odadaki kişileri izle
  useEffect(() => {
    if (!me || !roomId) return;
    const unsub = onSnapshot(
      roomPeers(roomId),
      (snap) => {
        peersRef.current = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setParticipants(peersRef.current.filter((p) => p.id !== me.uid && p.inCall));
        syncPeers();
      },
      (e) => console.warn("Peer listener error", e),
    );
    return () => {
      unsub();
      setParticipants([]);
    };
  }, [me, roomId]);

  // Bana gelen sinyalleri izle
  useEffect(() => {
    if (!me || !roomId) return;
    const q = query(signalItems(roomId, me.uid), orderBy("ts"));

    const unsub = onSnapshot(q, async (snap) => {
      for (const change of snap.docChanges()) {
        if (change.type !== "added") continue;
        const d = change.doc.data();

        try {
          if (d.type === "offer") {
            if (!inCallRef.current) continue; // görüşmede değilsem teklifi yok say
            if (pcs.current.has(d.from)) closePC(d.from); // aynı kişi yeniden katılmış olabilir
            const pc = getPC(d.from);
            await pc.setRemoteDescription(d.sdp);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal(d.from, { type: "answer", sdp: { type: answer.type, sdp: answer.sdp } });
          } else {
            const pc = pcs.current.get(d.from);
            if (!pc) continue;
            if (d.type === "answer") await pc.setRemoteDescription(d.sdp);
            else if (d.type === "candidate") await pc.addIceCandidate(d.candidate);
          }
        } catch (e) {
          console.warn("WebRTC signal error", e);
        } finally {
          deleteDoc(change.doc.ref).catch(() => {});
        }
      }
    });

    return unsub;
  }, [me, roomId]);

  // Mobil tarayıcı ekran kilidinden döndüğünde WebRTC bağlantısını canlandır.
  useEffect(() => {
    if (!me || !roomId) return;

    function recoverAfterBackground() {
      if (document.visibilityState !== "visible" || !inCallRef.current) return;

      const local = localRef.current;
      setPresence({
        inCall: true,
        mic: local?.getAudioTracks().some((track) => track.enabled) ?? false,
        video: local?.getVideoTracks().some((track) => track.enabled) ?? false,
      }).catch(() => {});

      const current = meRef.current;
      if (!current) return;
      for (const [pid, pc] of pcs.current) {
        if (current.uid >= pid) continue;
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          closePC(pid);
          continue;
        }
        pc.restartIce?.();
        makeOffer(pid, { iceRestart: true }).catch(() => {});
      }
      syncPeers();
    }

    document.addEventListener("visibilitychange", recoverAfterBackground);
    window.addEventListener("online", recoverAfterBackground);
    return () => {
      document.removeEventListener("visibilitychange", recoverAfterBackground);
      window.removeEventListener("online", recoverAfterBackground);
    };
  }, [me, roomId]);

  // Bileşen kapanınca her şeyi bırak
  useEffect(
    () => () => {
      for (const pc of pcs.current.values()) pc.close();
      pcs.current.clear();
      localRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  async function joinCall(video) {
    if (inCallRef.current || !meRef.current) return;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    } catch {
      onError("Mikrofon veya kamera izni verilmedi. Tarayıcı ayarlarından izin verip tekrar dene.");
      return;
    }

    // Mobil tarayıcılarda ses yönlendirmesi setSinkId yerine Audio Session ile yapılabilir.
    if (navigator.audioSession) {
      try {
        navigator.audioSession.type = "playback";
      } catch {
        // Tarayıcı bu ses oturumu türünü kabul etmeyebilir.
      }
    }

    localRef.current = stream;
    setLocalStream(stream);
    setWithVideo(video);
    setMicOn(true);
    setCamOn(video);
    inCallRef.current = true;
    setInCall(true);

    try {
      await setPresence({ inCall: true, mic: true, video });
      syncPeers();
    } catch (e) {
      onError("Görüşmeye katılınamadı: " + e.message);
    }
  }

  async function leaveCall() {
    for (const id of [...pcs.current.keys()]) closePC(id);

    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    inCallRef.current = false;

    setLocalStream(null);
    setRemoteStreams({});
    setInCall(false);
    setWithVideo(false);

    await setPresence({ inCall: false, video: false, mic: false }).catch(() => {});
  }

  async function toggleTracks(kind, setter) {
    const tracks = kind === "audio" ? localRef.current?.getAudioTracks() : localRef.current?.getVideoTracks();
    if (!tracks?.length) return;
    const next = !tracks[0].enabled;
    tracks.forEach((t) => (t.enabled = next));
    setter(next);
    await setPresence(kind === "audio" ? { mic: next } : { video: next }).catch(() => {});
  }

  return {
    inCall,
    withVideo,
    localStream,
    participants,
    remoteStreams,
    micOn,
    camOn,
    joinCall,
    leaveCall,
    toggleMic: () => toggleTracks("audio", setMicOn),
    toggleCam: () => toggleTracks("video", setCamOn),
  };
}
