import { useEffect, useState } from "react";
import { browserLocalPersistence, setPersistence, signInAnonymously } from "firebase/auth";
import { deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, configured, roomInfo, roomPeers, userRoom, userRooms } from "../lib/firebase";

export function useMyRooms(identity, onError) {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (!configured || !identity) {
      setRooms([]);
      return undefined;
    }

    let active = true;
    let unsubscribeMemberships = null;
    const unsubscribeNames = new Map();

    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const { user } = await signInAnonymously(auth);
        if (!active) return;

        const membershipQuery = query(userRooms(user.uid), orderBy("lastSeen", "desc"));
        unsubscribeMemberships = onSnapshot(
          membershipQuery,
          (snap) => {
            const memberships = snap.docs.map((item) => ({
              roomId: item.id,
              name: item.data().name || "Yeni oda",
            }));
            const ids = new Set(memberships.map((room) => room.roomId));

            for (const [id, unsubscribe] of unsubscribeNames) {
              if (!ids.has(id)) {
                unsubscribe();
                unsubscribeNames.delete(id);
              }
            }

            setRooms((current) => {
              const previousNames = new Map(current.map((room) => [room.roomId, room.name]));
              return memberships.map((room) => ({ ...room, name: previousNames.get(room.roomId) || room.name }));
            });

            for (const room of memberships) {
              if (unsubscribeNames.has(room.roomId)) continue;
              const unsubscribe = onSnapshot(
                roomInfo(room.roomId),
                (roomSnap) => {
                  const nextName = roomSnap.data()?.name || "Yeni oda";
                  setRooms((current) =>
                    current.map((item) => (item.roomId === room.roomId ? { ...item, name: nextName } : item)),
                  );
                },
                (error) => onError("Oda adı okunamadı: " + error.message),
              );
              unsubscribeNames.set(room.roomId, unsubscribe);
            }
          },
          (error) => onError("Odalar okunamadı: " + error.message),
        );
      } catch (error) {
        onError("Firebase bağlantısı kurulamadı: " + error.message, true);
      }
    })();

    return () => {
      active = false;
      unsubscribeMemberships?.();
      for (const unsubscribe of unsubscribeNames.values()) unsubscribe();
      unsubscribeNames.clear();
    };
  }, [identity, onError]);

  async function leaveRoom(roomId) {
    const user = auth?.currentUser;
    if (!user) return false;
    try {
      await Promise.all([deleteDoc(userRoom(user.uid, roomId)), deleteDoc(docForPeer(user.uid, roomId))]);
      return true;
    } catch (error) {
      onError("Odadan ayrılınamadı: " + error.message);
      return false;
    }
  }

  return { rooms, leaveRoom };
}

function docForPeer(uid, roomId) {
  return doc(roomPeers(roomId), uid);
}
