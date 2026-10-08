import React, { useEffect, useRef } from "react";

export default function VideoTile({
  stream,
  label,
  muted = false,
  mirrored = false,
  videoOff = false,
  micOn = true,
  cameraOn = true,
  sinkId = "",
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream || null;
  }, [stream]);

  useEffect(() => {
    if (!ref.current || muted || !sinkId || typeof ref.current.setSinkId !== "function") return;
    ref.current.setSinkId(sinkId).catch(() => {});
  }, [muted, sinkId, stream]);

  const showAvatar = !stream || videoOff;

  return (
    <div className="tile">
      <video ref={ref} autoPlay playsInline muted={muted} className={mirrored ? "mirrored" : ""} />
      {showAvatar && (
        <div className="tile-avatar" aria-hidden="true">
          <span>{(label || "?").charAt(0).toLocaleUpperCase("tr")}</span>
        </div>
      )}
      <span className="tile-label">{label}</span>
      <span className="tile-status" aria-label={`${micOn ? "Mikrofon açık" : "Mikrofon kapalı"}, ${cameraOn ? "kamera açık" : "kamera kapalı"}`}>
        {micOn ? "🎤" : "🔇"} {cameraOn ? "📹" : "🚫"}
      </span>
    </div>
  );
}
