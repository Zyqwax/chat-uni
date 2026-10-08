import React, { useEffect, useMemo, useState } from "react";
import VideoTile from "./VideoTile";

export default function CallPanel({
  localStream,
  withVideo,
  micOn,
  camOn,
  participants,
  remoteStreams,
  onToggleMic,
  onToggleCam,
  onLeave,
  onError,
}) {
  const [speakerMode, setSpeakerMode] = useState("speaker");
  const [outputDevices, setOutputDevices] = useState([]);

  const canChooseOutput = useMemo(
    () => typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype,
    [],
  );
  const canUseAudioSession = typeof navigator !== "undefined" && "audioSession" in navigator;

  useEffect(() => {
    if (!canChooseOutput || !navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setOutputDevices(devices.filter((device) => device.kind === "audiooutput"));
    }).catch(() => {});
  }, [canChooseOutput]);

  const outputDeviceId = useMemo(() => {
    if (!canChooseOutput) return "";
    const match = outputDevices.find((device) => {
      const label = device.label.toLocaleLowerCase("tr");
      return speakerMode === "speaker"
        ? /speaker|hoparlör|default/.test(label)
        : /earpiece|receiver|ahize|telefon/.test(label);
    });
    return match?.deviceId || "";
  }, [canChooseOutput, outputDevices, speakerMode]);

  function toggleSpeaker() {
    if (!canChooseOutput && !canUseAudioSession) {
      onError?.("Bu telefon tarayıcısı ses çıkışını uygulama içinden değiştirmeyi desteklemiyor. Hoparlör/ahizeyi telefonun ses menüsünden değiştir.");
      return;
    }
    setSpeakerMode((current) => {
      const next = current === "speaker" ? "earpiece" : "speaker";
      if (canUseAudioSession) {
        try {
          // Her iki modda da mikrofonlu görüşme oturumu korunur; playback
          // bazı telefonlarda uzak sesi tamamen susturabiliyor.
          navigator.audioSession.type = "play-and-record";
        } catch {
          // Fallback olarak setSinkId kullanılmaya devam eder.
        }
      }
      return next;
    });
  }

  return (
    <section className="call" aria-label="Görüşme">
      <div className="grid">
        <VideoTile
          stream={localStream}
          label="Sen"
          muted
          mirrored
          micOn={micOn}
          cameraOn={withVideo && camOn}
          videoOff={!withVideo || !camOn}
        />

        {participants.map((peer) => (
          <VideoTile
            key={peer.id}
            stream={remoteStreams[peer.id]}
            label={peer.name || "Arkadaş"}
            videoOff={!peer.video}
            micOn={peer.mic !== false}
            cameraOn={peer.video === true}
            sinkId={outputDeviceId}
          />
        ))}
      </div>

      <div className="controls">
        <button className="btn btn--toggle" aria-pressed={micOn} onClick={onToggleMic}>
          {micOn ? "🎤 Mikrofon açık" : "🔇 Mikrofon kapalı"}
        </button>

        {withVideo && (
          <button className="btn btn--toggle" aria-pressed={camOn} onClick={onToggleCam}>
            {camOn ? "📹 Kamera açık" : "🚫 Kamera kapalı"}
          </button>
        )}

        <button
          className="btn btn--toggle"
          aria-pressed={speakerMode === "speaker"}
          onClick={toggleSpeaker}
          title={canChooseOutput || canUseAudioSession ? "Ses çıkışını değiştir" : "Telefonun ses menüsünü kullan"}
        >
          {speakerMode === "speaker" ? "🔊 Hoparlör" : "📞 Ahize"}
        </button>

        <button className="btn btn--danger" onClick={onLeave}>
          Görüşmeden ayrıl
        </button>
      </div>
    </section>
  );
}
