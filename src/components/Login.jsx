import React, { useState } from "react";

export default function Login({ savedName, rooms, onEnter, onJoin, onCreate, onLeaveRoom, notice }) {
  const [name, setName] = useState(savedName);
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");

  function submit(e, roomId) {
    e?.preventDefault();
    const n = name.trim();
    if (n.length < 2) return setError("İsim en az 2 karakter olmalı.");
    setError("");
    if (roomId) onEnter(n, roomId);
    else onCreate(n);
  }

  function joinRoom(e) {
    e.preventDefault();
    const n = name.trim();
    const id = roomId.trim().toLowerCase();
    if (n.length < 2) return setError("İsim en az 2 karakter olmalı.");
    if (id.length < 4) return setError("Geçerli bir oda ID'si yaz.");
    setError("");
    onJoin(n, id);
  }

  const message = error || notice;

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <h1>Yakın Arkadaşlar</h1>
        <p className="login-hint">İsmini yaz, bir odaya katıl veya yeni bir oda oluştur.</p>

        <label>
          İsmin
          <input value={name} maxLength={30} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>

        <div className="join-room">
          <label htmlFor="room-id">Oda ID'si</label>
          <div className="join-room-controls">
            <input
              id="room-id"
              value={roomId}
              maxLength={40}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Örn. oda-a1b2c3d4e5f6"
              autoCapitalize="none"
              spellCheck="false"
            />
            <button className="btn" type="button" onClick={joinRoom}>
              Odaya katıl
            </button>
          </div>
        </div>

        {rooms.length > 0 ? (
          <div className="room-list" aria-label="Eski odalar">
            <div className="room-list-title">Üyesi olduğun odalar</div>
            {rooms.map(({ roomId, name }) => (
              <div className="room-item" key={roomId}>
                <button className="room-item-join" type="button" onClick={(e) => submit(e, roomId)}>
                  <span>
                    <strong>{name}</strong>
                    <small>{roomId}</small>
                  </span>
                  <span aria-hidden="true">›</span>
                </button>
                <button
                  className="room-item-leave"
                  type="button"
                  onClick={() => onLeaveRoom(roomId)}
                  aria-label={`${name} odasından ayrıl`}
                  title="Bu odadan ayrıl"
                >
                  Ayrıl
                </button>
              </div>
            ))}
            <button className="btn btn--accent btn--full" type="button" onClick={submit}>
              Yeni oda oluştur
            </button>
          </div>
        ) : (
          <button className="btn btn--accent btn--full" type="submit">
            Oda oluştur
          </button>
        )}

        {message && (
          <div className="form-error" role="alert">
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
