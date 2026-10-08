import React, { useEffect, useRef } from "react";

function formatTime(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function MessageList({ messages, meUid }) {
  const boxRef = useRef(null);

  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages]);

  return (
    <div className="messages" ref={boxRef} aria-live="polite">
      {!messages.length && <div className="empty">Henüz mesaj yok. İlk mesajı sen yaz.</div>}

      {messages.map((m, i) => {
        const mine = m.uid === meUid;
        const first = messages[i - 1]?.uid !== m.uid;

        return (
          <div className={`msg${mine ? " msg--mine" : ""}${first ? " msg--first" : ""}`} key={m.id}>
            {first && !mine && <b className="msg-name">{m.name || "Arkadaş"}</b>}
            <p className="msg-text">{m.text}</p>
            <time className="msg-time">{formatTime(m.ts)}</time>
          </div>
        );
      })}
    </div>
  );
}
