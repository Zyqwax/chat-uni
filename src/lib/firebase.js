import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { collection, doc, getFirestore } from "firebase/firestore";
import { firebaseConfig } from "../config.js";

export const ICE = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun.cloudflare.com:3478" }],
};

export const configured = Object.values(firebaseConfig).every(Boolean);

const app = configured ? (getApps()[0] ?? initializeApp(firebaseConfig)) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export const roomPeers = (roomId) => collection(db, "rooms", roomId, "peers");
export const roomMessages = (roomId) => collection(db, "rooms", roomId, "messages");
export const roomInfo = (roomId) => doc(db, "rooms", roomId);
export const userRooms = (uid) => collection(db, "users", uid, "rooms");
export const userRoom = (uid, roomId) => doc(db, "users", uid, "rooms", roomId);
export const signalItems = (roomId, peerId) => collection(db, "rooms", roomId, "signals", peerId, "items");
