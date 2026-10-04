# RidePass

A mobile-first web app that verifies car trips from both sides. The passenger shows a QR pass to start the trip, then scans the driver's QR to end it. Both phones agree on who rode with whom, in which car, and when. It's built to feel like a native app on Android Chrome and iPhone Safari, outdoors and in a dark car.

**Production:** https://ridepass-omega.vercel.app

**Demo accounts** (for testing on two phones): open the app, tap **Already registered? Enter your code**, and use `DRV-777` (driver) on one phone and `PAX-777` (passenger) on the other.

"RidePass" is a placeholder name. Change `APP_NAME` in `lib/config.ts` and the rest of the app follows.

## How it works

There are two roles, **driver** and **passenger**. Each person registers once on their own phone (no password) and gets a personal QR code. A code is 6 characters with no look-alikes (no 0/O/1/I/L), shown as `K7M-2QX` and accepted in any case.

**Start a trip (driver's phone)**

1. The passenger gets in and opens their Ride Pass.
2. The driver taps **Start trip** and scans the pass. The app shows the verified passenger.
3. The driver takes a live photo of the dashboard, with the steering and odometer in view.
4. The driver taps **Start journey**. The start time comes from the database clock.
5. The passenger's phone switches to "Trip in progress" by itself within a few seconds.

**End a trip (passenger's phone)**

1. At the destination, the passenger taps **I've arrived** and scans the driver's QR, either on the driver's phone or printed in the car.
2. Only the QR of their own trip's driver works. The end time comes from the database clock.
3. The passenger sees a receipt and an optional review: 1–5 stars, quick tags and a comment. They can skip it and use "Rate this trip" later.
4. The driver's phone shows "Trip with {name} completed".

**Rules.** These are enforced on the server in `lib/data.ts`, and the UI turns them into friendly messages:

- Drivers scan passenger QRs and passengers scan driver QRs.
- A passenger can have one active trip (a unique index guards this). A driver can run several at once.
- Only the trip's own driver QR can end it.
- No trip starts without the dashboard photo.
- Only the passenger reviews, once per trip. Drivers never receive reviews.

## Stack

- **Next.js 16** (App Router, TypeScript), **React 19**, **Tailwind CSS v4**
- **shadcn/ui** on **Base UI**, **lucide-react** icons, **sonner** toasts, **SWR** for polling
- **qrcode.react** draws the QR codes. **barcode-detector** reads them: it uses the browser's native `BarcodeDetector` where it supports QR, and ZXing WebAssembly elsewhere.
- **Supabase** (Postgres and Storage), used only from the server with `@supabase/supabase-js`
- **Vercel** for hosting

## Project structure

```
app/                     Pages (App Router) and API route handlers (app/api/**)
  q/[code]/              Where every QR link lands (see "QR codes and scanning")
  manifest.ts            PWA manifest; icons in public/icons, app/apple-icon.png
components/              Screens and shared UI (components/ui = shadcn/ui on Base UI)
hooks/                   Client hooks: camera, home polling, actions, wake lock
lib/
  data.ts                The only data boundary: every Supabase call and every rule
  supabase.ts, env.ts    Server-only Supabase client and settings
  session.ts             Cookie identity
  strings.ts             Every piece of UI text
  codes.ts               Personal codes and QR payloads
  format.ts              Times and durations, always in Asia/Dhaka
  config.ts              APP_NAME and settings (poll interval, photo limits, cookie)
supabase/schema.sql      Tables, indexes, RLS, grants and the photo bucket
scripts/copy-zxing-wasm.mjs   Copies the QR decoder's .wasm into public/zxing
```

`lib/data.ts` holds plain functions such as `createProfile`, `getProfileByCode`, `startTrip`, `endTrip`, `submitReview`, `listTrips` and `getTrip`. Route handlers and server pages call it. The browser never talks to Supabase: client code calls `/api/*` through `lib/api-client.ts`. To swap the backend, rewrite `lib/data.ts`.

### Screens

| Route                  | What it does                                                                      |
| ---------------------- | --------------------------------------------------------------------------------- |
| `/`                    | Redirects on the server to `/driver`, `/passenger` or `/welcome` from the cookie  |
| `/welcome`             | Pick a role, enter details, see your QR. Includes restore by code.                |
| `/passenger`           | The Ride Pass, or the live trip with a ticking timer. Recent trips.               |
| `/driver`              | Own QR and active trips while driving. Recent trips. Tap the plate to change car. |
| `/driver/qr`           | My QR with a print layout for the car                                             |
| `/scan`                | Full-screen scanner for both roles, with "Type the code instead"                  |
| `/driver/start/[code]` | Verified passenger, then dashboard photo, then Start journey                      |
| `/trips/[id]/done`     | The passenger's receipt and review                                                |
| `/trips/[id]`          | Trip details with the dashboard photo, for that trip's driver and passenger only  |
| `/q/[code]`            | Where QR links land, including from the phone's own camera app                    |

### API

| Endpoint                      | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `GET /api/home`               | Profile, active trips and recent trips (polled by the homes)   |
| `POST /api/profile`           | Onboarding: create a profile and set the cookie                |
| `POST /api/profile/restore`   | Restore a profile on this phone by code                        |
| `POST /api/profile/reset`     | "Reset this device": forget the profile on this phone          |
| `POST /api/profile/vehicle`   | Driver changes the vehicle number                              |
| `GET /api/lookup?code=…`      | Driver checks a scanned passenger code                         |
| `POST /api/trips`             | Start a trip (FormData: `passengerCode`, `photo`)              |
| `POST /api/trips/end`         | Passenger ends their trip (`{ driverCode }`)                   |
| `GET /api/trips/[id]`         | One trip, for its driver or passenger                          |
| `POST /api/trips/[id]/review` | Passenger rates a completed trip (`{ rating, tags, comment }`) |
| `GET /api/trips/[id]/photo`   | Redirects to a short-lived signed link to the dashboard photo  |

Errors come back as `{ error: { code } }`. The UI maps each code to text in `strings.errors`.

## Set up Supabase

1. Create a project at [supabase.com](https://supabase.com). Pick the region closest to your users, and run your Vercel functions next to it (see "Deploy to Vercel").
2. Open **SQL Editor → New query**, paste the contents of `supabase/schema.sql` and click **Run**. It is meant for a fresh project and creates:
   - the `profiles` and `trips` tables and their indexes;
   - Row Level Security on both tables, with no policies;
   - explicit table grants to `service_role`;
   - the private `dashboard-photos` Storage bucket.
3. Open **Storage** and check that `dashboard-photos` exists and is **not** public.
4. Open **Project Settings → Data API** and keep `public` in **Exposed schemas** (the default). `supabase-js` reads and writes through the Data API.
5. Open **Project Settings → API Keys**, then the **Publishable and secret API keys** tab. Copy a **secret key** (`sb_secret_…`). A legacy `service_role` key, from the legacy keys tab, also works. Copy the **Project URL** too. The project's **Connect** dialog also shows it.

About grants: a table is only reachable through the Data API when a role has privileges on it. Supabase is moving its platform default to opt-in grants, so the schema grants `service_role` explicitly. Without that grant you get Postgres error `42501`.

After changing the schema, regenerate `lib/database.types.ts` with the Supabase CLI's `gen types` command or the Supabase MCP server's `generate_typescript_types`.

## Environment variables

Copy `.env.example` to `.env.local` and fill it in. `.env*` files are gitignored, except the example.

| Variable              | Required | Notes                                                                            |
| --------------------- | -------- | -------------------------------------------------------------------------------- |
| `SUPABASE_URL`        | yes      | `https://<project-ref>.supabase.co`                                              |
| `SUPABASE_SECRET_KEY` | yes      | The secret key (`sb_secret_…`). `SUPABASE_SERVICE_ROLE_KEY` is accepted instead. |
| `NEXT_PUBLIC_APP_URL` | no       | Base URL inside QR codes. Defaults to the address the app was opened on.         |

Never put the secret key in a `NEXT_PUBLIC_` variable. Only server-only modules read it (`lib/env.ts` and `lib/supabase.ts`). `NEXT_PUBLIC_APP_URL` is built into the client bundle, so redeploy after changing it.

When the Supabase variables are missing, the app shows a "Supabase not configured" screen instead of crashing.

## Run locally

You need Node.js 20.9 or newer, which Next.js 16 requires.

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev                  # http://127.0.0.1:3000
```

- `npm run dev` binds to `127.0.0.1` (`next dev -H 127.0.0.1`), so Windows doesn't ask for firewall or admin rights.
- `predev` and `prebuild` run `scripts/copy-zxing-wasm.mjs`. It copies the ZXing decoder's `.wasm` from `node_modules` into `public/zxing/`, which is gitignored, so the scanner loads it from our own origin instead of a CDN.
- `npm run build` creates the production build, `npm run start` serves it, and `npm run lint` runs ESLint.

## Test on a phone (HTTPS)

Phones only allow the camera on HTTPS; `localhost` on the computer itself is the exception. A phone opening `http://192.168.x.x:3000` gets **no camera**. Use one of these:

- **The Vercel deployment.** This is the simplest option.
- **A tunnel to the dev server.** Each command prints an `https://` URL to open on the phone:

  ```bash
  cloudflared tunnel --url http://127.0.0.1:3000
  # or
  ngrok http 127.0.0.1:3000
  ```

`allowedDevOrigins` in `next.config.ts` already allows `*.trycloudflare.com` and ngrok domains (and LAN addresses), so the dev server accepts them. Each tunnel URL is a new site to the phone, with its own cookies. Restore your profile there with **Already registered? Enter your code**.

## Deploy to Vercel

1. Import the repository in Vercel. The **Next.js** framework preset is detected.
2. `vercel.json` pins functions to `hnd1` (Tokyo), next to the Supabase database. Change the region if your database lives elsewhere.
3. Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` for **Production** and **Preview**, and mark the key as Sensitive. Add `NEXT_PUBLIC_APP_URL` if you want QR codes to always point at one domain.
4. In **Settings → Deployment Protection**, limit Vercel Authentication to preview deployments. That keeps the production URL public, so any phone can open it without a Vercel login.
5. Deploy with `npx vercel deploy --prod`, or push to the connected Git branch.

`.vercelignore` keeps local tooling and `.env*` files out of CLI uploads.

## Under the hood

### Identity

There is no login yet. After onboarding, the server sets an httpOnly cookie, `rp_pid`, that holds the profile id. It lasts one year, is SameSite=Lax, and is Secure in production. Server code reads it through `lib/session.ts`. Identity is kept out of `localStorage` because iPhone Safari can wipe it.

- **One pass per phone.** Onboarding refuses to create a second profile on a phone that already has one.
- **Restore by code.** On a new phone, "Already registered? Enter your code" sets the cookie for that profile.
- **Reset this device.** This is in the profile sheet behind the header avatar. It clears the cookie. The profile stays and can be restored with its code.

### Live updates

There is no Realtime. The home screens poll `GET /api/home` every 4 s with SWR, only while the page is visible and only while they're waiting on the other phone:

- the passenger polls while waiting for a trip to start;
- the driver polls while trips are running, waiting for them to end.

Trip data is never cached: API responses are `Cache-Control: no-store`, and server-side Supabase requests use `cache: "no-store"`.

### Time

- `started_at` uses the column default `now()`. `ended_at` and `reviewed_at` are written as `'now'`, which Postgres turns into its own current time. Every timestamp comes from the database clock, never the phone's.
- Times are displayed with `Intl` and an explicit `timeZone: "Asia/Dhaka"` (`lib/format.ts`). The server, which runs in UTC on Vercel, and the phone therefore render the same text, and hydration never mismatches.
- Live timers use a server-clock offset. The HTML carries the server time at page load, and every API response refreshes it through an `X-Server-Now` header (`lib/clock.ts`). This keeps timers right on a phone whose clock is off.

### Photos

- Dashboard photos come from the live camera. They are compressed in the browser (`lib/image.ts`) to at most 1600 px on the long side as JPEG, starting at quality 0.8 and stepping down to aim for under ~500 KB. Vercel's request limit is 4.5 MB.
- If the live camera can't start, the phone's own camera app is the fallback.
- The server accepts only JPEG, up to 4 MB.
- Starting a trip runs: validate, create the trip id, upload to `trips/<tripId>/start.jpg` in the private `dashboard-photos` bucket, then insert the row. If the insert fails, the photo is deleted.
- Photos are shown with a plain `<img>` pointing at `/api/trips/[id]/photo`. That route checks the viewer is on the trip, then redirects to a signed link that is valid for 5 minutes.

### QR codes and scanning

- **QR content** is `${NEXT_PUBLIC_APP_URL || origin}/q/<CODE>`.
- **The in-app scanner** accepts any URL ending in `/q/<code>`, or a bare code. It ignores the host (`extractCode` in `lib/codes.ts`), so QR codes from dev and from production both work.
- **Decoding** uses the browser's native `BarcodeDetector` where it supports QR (Android Chrome). Elsewhere, including iPhone Safari, it uses the `barcode-detector` ponyfill (ZXing-C++ in WebAssembly), whose `.wasm` is self-hosted at `/zxing/`.
- **Camera rules** (`lib/camera.ts`, `hooks/use-camera.ts`):
  - back camera;
  - `playsInline` video;
  - one stream at a time;
  - every track is stopped after a scan or photo, on unmount and when the page is hidden, so the camera light turns off.

  A short "Allow camera" screen appears before the first use. When the camera is blocked, the app shows how to allow it in Chrome and Safari, with "Type the code instead".
- **`/q/<code>` from the phone's camera app.** Because QR codes are links, the phone's own camera app works too. `/q/[code]` only reads and never changes data on load:
  - a driver opening a passenger's code goes to the start-trip flow;
  - a passenger opening their own trip's driver code gets an **End trip** confirmation, and the trip ends only on that tap;
  - every other case gets a short explanation;
  - an unregistered phone onboards first, then continues to the same link.

### Install as an app

`app/manifest.ts` makes the app installable: standalone, portrait, with any-purpose and maskable icons rendered from `app/icon.svg`. There is no service worker, because every screen needs live data. On iPhone, a Home Screen app can keep its cookies separate from Safari. If the installed app opens on the welcome screen, restore once with your code.

## Security notes

This is a prototype.

- **A code is effectively the account.** Anyone who knows a code can restore that profile on their own phone, and drivers' codes are printed in their cars. Add real authentication before production use.
- **RLS is on with no policies**, so the publishable/anon key can't read or write anything. Only the server's secret key, which bypasses RLS, can.
- **The secret key stays on the server.** It is read only in modules marked `server-only` and is never sent to the browser.
- **API writes are same-origin only.** They check that the `Origin` matches the host, and the cookie is httpOnly and SameSite=Lax.
- **Reviews never reach drivers**, so they stay honest.
- **Photos are private** and only served through short-lived signed links, to the trip's driver and passenger.
- **The camera is limited to this site** with a `Permissions-Policy` header.

## Next steps

- Login/auth
- Admin dashboard (use the Supabase Table Editor for now)
- GPS/maps
- End-of-trip odometer photo
- Notifications/SMS
- Offline mode
- Dark mode
- Bangla text (all copy is in `lib/strings.ts`)
- Stuck trips (e.g. the passenger's phone died)
- Automated tests
