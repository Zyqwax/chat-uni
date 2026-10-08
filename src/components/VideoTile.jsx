import React, { useEffect, useRef } from "react";

export default function VideoTile({ stream, label, muted = false, mirrored = false, videoOff = false }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream || null;
  }, [stream]);

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
    </div>
  );
}
