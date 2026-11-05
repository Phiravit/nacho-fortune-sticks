# QR codes point to fixed `/s/<n>` URLs on Cloudflare

The QR codes printed on the real Sticks (currently `/s/1`–`/s/4`, one per Ingredient) encode `https://<domain>/s/<n>`, so these URLs are a permanent contract: no host move, domain change or route rename may ever break them. The site is a static-assets Cloudflare Worker (what Cloudflare now calls Pages), on the free plan where static asset requests are free and unlimited; it serves clean single-page-app paths because `wrangler.jsonc` sets `assets.not_found_handling` to `"single-page-application"`. GitHub Pages was rejected because it would force hash URLs (`/#/s/4`) into the printed codes. We chose plain numbers over secret codes because booth staff see the real Stick anyway, so typing another number gains nothing, and shorter URLs make simpler QR codes that are easier to scan.

## Consequences

- Print the QR codes only after the production domain is final; the hidden `/print` page generates them from whatever domain it is served on. Current address: `https://siamsi-nacho.siamsi-nacho.workers.dev`.
- Never remove the `single-page-application` setting from `wrangler.jsonc`: without it every `/s/<n>` link would 404.
- If a custom domain is added later, keep the `workers.dev` address enabled too, so codes already printed keep working.
- Unknown Stick numbers (e.g. `/s/9`) redirect to the homepage rather than erroring, so adding Sticks later only adds URLs, never changes existing ones.
