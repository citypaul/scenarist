# Scenarist promo video

A 90-second, 1080p60 promotional video for Scenarist. The video is generated from code, so you can re-render it after changing a line of copy.

| File | What it owns |
| --- | --- |
| `timeline.js` | Every timing value. `index.html` and `audio.mjs` both read it, so the sound effects stay in sync with the picture. |
| `index.html` | The visuals. Each scene is a pure function of time `t`, which makes every frame deterministic. |
| `audio.mjs` | Synthesises the soundtrack (drone, riser, 120 BPM groove, per-event hits). It uses no samples, so there's nothing to license. |
| `render.mjs` | Renders the page frame by frame in headless Chromium, encodes the frames in parallel with ffmpeg, and muxes in the soundtrack. |

## Preview

Open `index.html` in a browser. It plays in real time with a scrub bar. Use space to pause and ←/→ to jump 1 second. Add `?t=39.8` to the URL to freeze on a single moment.

## Render

The render needs Node 20+ and `ffmpeg` on your PATH.

```bash
npm install
npx playwright install chromium
node audio.mjs
node render.mjs
```

The finished video is written to `out/scenarist-promo.mp4`. The `out/` folder is gitignored.

To render single frames for review, pass `--stills`:

```bash
node render.mjs --stills 5,17,30
```

You can also pass `--fps 30` for a faster draft render or `--workers 4` to limit parallelism.

## Story

| Time | Scene | Message |
| --- | --- | --- |
| 0–8s | Hook | A Playwright run where only the happy path passes. Five real scenarios have never been tested: an Auth0 "email already registered", an expired session, a declined card, a 503, and stock selling out mid-checkout. Title: "Your tests cover the happy path. Production has other plans." |
| 8–16s | The gap | Unit tests can fake any scenario, but your code never runs. E2E tests run real code, but you can't make Auth0 or Stripe fail on cue. "What if you didn't have to choose?" |
| 16–22s | Reveal | Logo, wordmark, "Test reality. Control the rest." |
| 22–33s | The boundary | Real APIs only give you the happy path, and "Scenarios you can test" reads 1. The Scenarist boundary drops in and scripted responses come back per test (402 card_declined, 409 user_exists, 503). The counter climbs to ∞. "Your code runs for real. The world does what you script." |
| 33–43s | Code | A declarative `paymentDeclined` scenario, then a Playwright test with type-safe `switchScenario` autocomplete. |
| 43–55s | Watch it run | The test runs line by line while a real browser fills in checkout and clicks Pay. The request path lights up: the browser, then your server's middleware, validation and totals (*real code*), then Scenarist answering Stripe with `402 card_declined` (*scripted*), then your error handling showing "Payment failed". "A real browser. Your real server. Only Stripe is scripted." |
| 55–66s | Parallel | Six PayFlow scenarios run in parallel against one server. Each test has its own test ID, and the `sellsOutDuringCheckout` sequence flips mid-run. |
| 66–76s | Features | Request matching, sequences, stateful mocks, test-ID isolation, 0 kB in production, and the Next.js, Express and Playwright adapters. |
| 76–82s | Results | The suite runs green, including the Auth0 and Stripe edge cases, then three stats: every scenario on demand, real backend code in every test, and one server with zero restarts. |
| 82–90s | Call to action | The install command, scenarist.io and the GitHub repo. |

The suite numbers in the video (48 tests, 31 scenarios, 6.1s) are illustrative. The product claims are that scenarios switch per test without a restart, your server code runs unmocked, and conditional exports ship 0 kB of test code to production.

The docs landing page serves web encodes of this video: `apps/docs/public/video/`, made from `out/scenarist-promo.mp4` (see the commands below).

```bash
ffmpeg -i out/scenarist-promo.mp4 -vf fps=30 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart ../../../apps/docs/public/video/scenarist-overview.mp4
ffmpeg -i out/scenarist-promo.mp4 -vf fps=30 -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -c:a libopus -b:a 128k ../../../apps/docs/public/video/scenarist-overview.webm
```

The poster (`scenarist-overview-poster.webp`) is the 7.3s frame resized to 1280×720. If you change the script, update the captions in `scenarist-overview.en.vtt` too.
