import { useCallback, useEffect, useState } from "react";
import { browserLocalPersistence, setPersistence, signInAnonymously } from "firebase/auth";
import { addDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, configured, roomInfo, roomMessages, roomPeers, userRoom } from "../lib/firebase";

/** Anonim giriş + varlık kaydı + mesaj akışı. */
export function useRoom(identity, roomId, onError) {
  const [me, setMe] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roomName, setRoomName] = useState("");

  useEffect(() => {
    if (!configured || !identity || !roomId) return;

    let active = true;
    let unsubMessages = null;
    let unsubRoom = null;

    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const { user } = await signInAnonymously(auth);
        if (!active) return;

        const current = { uid: user.uid, name: identity.name, session: roomId };

        await setDoc(
          doc(roomPeers(roomId), user.uid),
          { name: current.name, session: current.session, inCall: false, mic: false, video: false, updated: serverTimestamp() },
          { merge: true },
        );
        await setDoc(userRoom(user.uid, roomId), { name: "Yeni oda", lastSeen: serverTimestamp() }, { merge: true });
        if (!active) return;

        setMe(current);

        const q = query(roomMessages(roomId), orderBy("ts", "desc"), limit(300));
        unsubMessages = onSnapshot(
          q,
          (snap) => setMessages(snap.docs.map((x) => ({ id: x.id, ...x.data() })).reverse()),
          (e) => onError("Mesajlar okunamadı: " + e.message),
        );
        unsubRoom = onSnapshot(
          roomInfo(roomId),
          (snap) => {
            const nextName = snap.data()?.name || "Yeni oda";
            setRoomName(nextName);
            setDoc(userRoom(current.uid, roomId), { name: nextName, lastSeen: serverTimestamp() }, { merge: true }).catch(() => {});
          },
          (e) => onError("Oda bilgisi okunamadı: " + e.message),
        );
      } catch (e) {
        onError("Firebase bağlantısı kurulamadı: " + e.message, true);
      }
    })();

    return () => {
      active = false;
      unsubMessages?.();
      unsubRoom?.();
      setMe(null);
      setMessages([]);
      setRoomName("");
    };
  }, [identity, roomId, onError]);

  const sendMessage = useCallback(
    async (text) => {
      if (!me) return false;
      try {
        await addDoc(roomMessages(roomId), { text, uid: me.uid, name: me.name, ts: serverTimestamp() });
        return true;
      } catch (e) {
        onError("Mesaj gönderilemedi: " + e.message);
        return false;
      }
    },
    [me, roomId, onError],
  );

  const renameRoom = useCallback(
    async (name) => {
      const nextName = name.trim();
      if (!me || !nextName) return false;
      try {
        await setDoc(
          roomInfo(roomId),
          { name: nextName.slice(0, 60), updatedBy: me.uid, updated: serverTimestamp() },
          { merge: true },
        );
        await setDoc(userRoom(me.uid, roomId), { name: nextName.slice(0, 60), lastSeen: serverTimestamp() }, { merge: true });
        return true;
      } catch (e) {
        onError("Oda adı değiştirilemedi: " + e.message);
        return false;
      }
    },
    [me, roomId, onError],
  );

  return { me, roomName, messages, sendMessage, renameRoom };
}
