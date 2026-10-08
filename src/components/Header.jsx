import React, { useEffect, useState } from "react";

export default function Header({
  me,
  roomId,
  roomName,
  inCall,
  callCount,
  onJoinVoice,
  onJoinVideo,
  onRooms,
  onRenameRoom,
}) {
  const liveCount = callCount + (inCall ? 1 : 0);
  const [draftName, setDraftName] = useState("");

  useEffect(() => setDraftName(roomName), [roomName]);

  async function submitRoomName(e) {
    e.preventDefault();
    await onRenameRoom(draftName);
  }

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>Yakın Arkadaşlar</h1>
        <p>
          {me ? (
            <>
              <strong>{me.name}</strong> <span>{roomId}</span>
            </>
          ) : (
            "Bağlanıyor…"
          )}
        </p>
      </div>

      <form className="room-name-form" onSubmit={submitRoomName}>
        <label htmlFor="room-name">Oda adı</label>
        <input
          id="room-name"
          value={draftName}
          maxLength={60}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Oda adı"
          disabled={!me}
        />
        <button className="btn btn--accent" type="submit" disabled={!me || !draftName.trim()}>
          Kaydet
        </button>
      </form>

      {liveCount > 0 && (
        <span className="status">
          <i aria-hidden="true" />
          {liveCount} kişi görüşmede
        </span>
      )}

      {!inCall && (
        <div className="topbar-actions">
          <button className="btn btn--onDeep" onClick={onRooms}>
            Odalar
          </button>
          <button className="btn btn--onDeep" disabled={!me} onClick={onJoinVoice}>
            🎤 Sesli katıl
          </button>
          <button className="btn btn--accent" disabled={!me} onClick={onJoinVideo}>
            📹 Görüntülü katıl
          </button>
        </div>
      )}
    </header>
  );
}
