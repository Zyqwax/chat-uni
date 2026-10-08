import React from "react";

export default function SetupBanner() {
  return (
    <div className="setup-banner" role="status">
      Firebase kurulumu gerekiyor: kök dizindeki <code>.env</code> dosyasına Firebase Web App bilgilerini ekle.
    </div>
  );
}
