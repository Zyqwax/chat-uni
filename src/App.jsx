import React, { useCallback, useState } from "react";
import { configured } from "./lib/firebase";
import { useRoom } from "./hooks/useRoom";
import { useMyRooms } from "./hooks/useMyRooms";
import { useCall } from "./hooks/useCall";
import Login from "./components/Login";
import Header from "./components/Header";
import SetupBanner from "./components/SetupBanner";
import CallPanel from "./components/CallPanel";
import MessageList from "./components/MessageList";
import Composer from "./components/Composer";
import "./styles.css";

const IDENTITY_KEY = "yakin-arkadaslar-identity";
const ACTIVE_ROOM_KEY = "yakin-arkadaslar-active-room";

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing or a full storage quota should not stop the chat.
  }
}

function createRoomId() {
  const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `oda-${random.replaceAll("-", "").slice(0, 12)}`;
}

export default function App() {
  const [identity, setIdentity] = useState(() => readStorage(IDENTITY_KEY, null));
  const [roomId, setRoomId] = useState(() => readStorage(ACTIVE_ROOM_KEY, ""));
  const [note, setNote] = useState("");

  const handleError = useCallback((message, fatal = false) => {
    setNote(message);
    if (fatal) {
      setIdentity(null);
      setRoomId("");
      writeStorage(IDENTITY_KEY, null);
      writeStorage(ACTIVE_ROOM_KEY, "");
    }
  }, []);

  const { me, roomName, messages, sendMessage, renameRoom } = useRoom(identity, roomId, handleError);
  const { rooms, leaveRoom } = useMyRooms(identity, handleError);
  const call = useCall(me, roomId, handleError);

  function openRoom(name, id) {
    const cleanName = name.trim();
    if (cleanName.length < 2) return setNote("İsim en az 2 karakter olmalı.");

    const nextIdentity = { name: cleanName };
    setIdentity(nextIdentity);
    setRoomId(id);
    writeStorage(IDENTITY_KEY, nextIdentity);
    writeStorage(ACTIVE_ROOM_KEY, id);
    setNote("");
  }

  function createRoom(name) {
    openRoom(name, createRoomId());
  }

  async function showRooms() {
    if (call.inCall) await call.leaveCall();
    setRoomId("");
    writeStorage(ACTIVE_ROOM_KEY, "");
  }

  if (!identity || !roomId) {
    return (
      <>
        {!configured && <SetupBanner />}
        <Login
          savedName={identity?.name ?? ""}
          rooms={rooms}
          onEnter={openRoom}
          onJoin={openRoom}
          onCreate={createRoom}
          onLeaveRoom={leaveRoom}
          notice={note}
        />
      </>
    );
  }

  return (
    <div className={`app${call.inCall ? " app--call" : ""}`}>
      <Header
        me={me}
        roomId={roomId}
        roomName={roomName}
        inCall={call.inCall}
        callCount={call.participants.length}
        onJoinVoice={() => call.joinCall(false)}
        onJoinVideo={() => call.joinCall(true)}
        onRooms={showRooms}
        onRenameRoom={renameRoom}
      />

      {!configured && <SetupBanner />}

      <main className="main">
        {call.inCall && (
          <CallPanel
            localStream={call.localStream}
            withVideo={call.withVideo}
            micOn={call.micOn}
            camOn={call.camOn}
            participants={call.participants}
            remoteStreams={call.remoteStreams}
            onToggleMic={call.toggleMic}
            onToggleCam={call.toggleCam}
            onLeave={call.leaveCall}
            onError={handleError}
          />
        )}

        <section className="chat" aria-label="Sohbet">
          {note && (
            <div className="note" role="alert">
              <span>{note}</span>
              <button className="note-close" onClick={() => setNote("")} aria-label="Uyarıyı kapat">
                ×
              </button>
            </div>
          )}
          <MessageList messages={messages} meUid={me?.uid} />
          <Composer disabled={!me} onSend={sendMessage} />
        </section>
      </main>
    </div>
  );
}
