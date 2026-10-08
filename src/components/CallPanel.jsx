import React from "react";
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
}) {
  return (
    <section className="call" aria-label="Görüşme">
      <div className="grid">
        <VideoTile stream={localStream} label="Sen" muted mirrored videoOff={!withVideo || !camOn} />

        {participants.map((peer) => (
          <VideoTile
            key={peer.id}
            stream={remoteStreams[peer.id]}
            label={peer.name || "Arkadaş"}
            videoOff={!peer.video}
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

        <button className="btn btn--danger" onClick={onLeave}>
          Görüşmeden ayrıl
        </button>
      </div>
    </section>
  );
}
