import React, { useState } from "react";

export default function Composer({ disabled, onSend }) {
  const [text, setText] = useState("");

  async function submit(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || disabled) return;

    setText("");
    const ok = await onSend(value);
    if (!ok) setText(value);
  }

  return (
    <form className="composer" onSubmit={submit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
        placeholder="Mesaj yaz"
        aria-label="Mesaj"
        autoComplete="off"
        disabled={disabled}
      />
      <button className="btn btn--accent" disabled={disabled || !text.trim()}>
        Gönder
      </button>
    </form>
  );
}
