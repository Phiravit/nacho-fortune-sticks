# เซียมซีนาโช่ · Siam Si Nacho

A mobile-only เซียมซี (fortune-stick) website by team **Nacho Show Pow(er)**. Shake the cup (tap it, or really shake your phone), pull the stick that rises, and its slip tells you which ingredient goes on your nachos — with a fortune.

Live: https://siamsi-nacho.siamsi-nacho.workers.dev

- **Homepage** — the Shake: tap the cup or shake the phone until a stick rises, then pull it.
- **`/s/1` … `/s/4`** — one Slip per Ingredient. These are printed as QR codes on the real sticks, so they must never change (see [docs/adr/0001](docs/adr/0001-fixed-qr-urls-on-cloudflare.md)).
- **`/print`** — hidden page that generates those QR codes from the live domain.

Words used in the code and docs (Stick, Slip, Shake, Pull, Scan, …) are defined in [CONTEXT.md](CONTEXT.md).

## Develop

```sh
npm install
npm run dev      # http://localhost:5173 (open on a phone on the same Wi-Fi via the Network URL)
npm run build
npm run deploy   # builds and deploys to Cloudflare (needs `npx wrangler login` once)
```

Phone shaking needs a browser that allows motion sensors: Chrome and Safari do; Brave blocks them (the site then offers "open in Chrome").
