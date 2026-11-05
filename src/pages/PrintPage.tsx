import { QRCodeSVG } from "qrcode.react";
import { STICKS } from "../data/sticks";

// Hidden organiser page (/print): one QR per real Stick, built from whatever
// domain this page is served on. See docs/adr/0001 — print only from the live site.

const LOCAL_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)|\.local$/;

export function PrintPage() {
  const origin = window.location.origin;
  const isLocal = LOCAL_HOST.test(window.location.hostname);

  return (
    <main className="print-page">
      <header className="print-head">
        <h1>QR ไม้เซียมซี</h1>
        <p className="print-origin">
          {origin}/s/1 – {origin}/s/{STICKS.length}
        </p>
        {isLocal && (
          <p className="print-warn">
            ⚠️ นี่คือเครื่องทดสอบ อย่าพิมพ์จากหน้านี้ — เปิด /print จากเว็บจริงก่อน
            <br />
            This is a local test server. Open /print on the live site before printing.
          </p>
        )}
        <button type="button" className="print-btn no-print" onClick={() => window.print()}>
          🖨️ พิมพ์ / Print
        </button>
      </header>

      <div className="qr-grid">
        {STICKS.map((s) => {
          const url = `${origin}/s/${s.number}`;
          return (
            <div className="qr-card" key={s.number}>
              <div className="qr-num">{s.number}</div>
              <QRCodeSVG value={url} size={180} level="M" marginSize={2} title={url} />
              <div className="qr-name">
                {s.ingredient.name.th} · {s.ingredient.name.en}
              </div>
              <div className="qr-url">{url}</div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
