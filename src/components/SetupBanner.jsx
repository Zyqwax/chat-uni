import React from "react";

export default function SetupBanner() {
  return (
    <div className="setup-banner" role="status">
      Firebase kurulumu gerekiyor: <code>src/config.js</code> içindeki <code>firebaseConfig</code> alanını kendi
      Firebase Web App değerlerinle doldur.
    </div>
  );
}
