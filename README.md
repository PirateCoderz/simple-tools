# Simple Tools – Free Image Convert, Compress & Enhance

**Free online image tools.** Convert between PNG, JPG, WebP and more, compress for smaller file sizes, and enhance with brightness, contrast, and saturation. No sign-in required.

---

## Features

| Tool | URL | What it does |
|------|-----|--------------|
| **All-in-one** | [/images/convert](/images/convert) | Pick output format, upload, convert, then optionally compress (quality) and enhance. See **original**, **converted**, and **after enhance** file sizes on one page. |
| **Converters** | [/images/converter](/images/converter) | List of conversions (e.g. PNG→WebP, JPG→WebP, WebP→PNG). Each opens a dedicated converter page. |
| **Compressor** | [/images/compressor](/images/compressor) | Upload, set quality and format (WebP/JPEG), download a smaller file. |
| **Enhancer** | [/images/enhancer](/images/enhancer) | Adjust brightness, contrast, and saturation in the browser. Download the result. |

- **No login needed** – use all tools without an account. Sign-in is optional.
- **Privacy** – conversion and compression run on the server; enhancer runs fully in your browser.
- **Simple UI** – one main action per page (upload → convert/download).

---

## Quick start

### Prerequisites

- **Node.js** 20+
- **MongoDB** (optional; only if you want sign-up / sign-in)

### Install and run

```bash
# Clone the repo (or download)
git clone <your-repo-url>
cd simple-tools

# Install dependencies
npm install

# Copy env example and set variables (see below)
cp .env.example .env

# Run development server
npm run dev
```

Open **http://localhost:3000**. Use the **Images** link in the nav to reach the image tools.

### Run without MongoDB

You can run the app without a database. Image tools work without it. Sign-in and sign-up will not work until you set `DB_URI` and run MongoDB.

---

## Environment variables

Create a `.env` file in the project root (see `.env.example`).

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_URI` | For auth | MongoDB connection string (e.g. `mongodb://localhost:27017/simple-tools`) |
| `DB_USER` | Optional | MongoDB username |
| `DB_PASS` | Optional | MongoDB password |
| `NEXTAUTH_SECRET` | For auth | Secret for NextAuth.js sessions (e.g. `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | For auth | App URL (e.g. `http://localhost:3000`) |

Image tools do **not** require any of these.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) at [http://localhost:3000](http://localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Tech stack

- **Framework:** [Next.js](https://nextjs.org) 16 (App Router)
- **UI:** React 19, [Tailwind CSS](https://tailwindcss.com) 4, [shadcn](https://ui.shadcn.com)
- **Image processing:** [Sharp](https://sharp.pixelplumbing.com/) (convert & compress)
- **Auth (optional):** [NextAuth.js](https://next-auth.js.org), MongoDB (Mongoose), bcrypt

---

## Project structure

```
simple-tools/
├── app/
│   ├── images/           # Image tools
│   │   ├── page.tsx      # Hub: links to convert, converter, compressor, enhancer
│   │   ├── convert/     # All-in-one: convert + compress + enhance
│   │   ├── converter/   # List + per-format converters (e.g. png-to-webp)
│   │   ├── compressor/
│   │   └── enhancer/
│   ├── api/
│   │   ├── images/       # POST /api/images/convert, /api/images/compress
│   │   └── auth/
│   ├── layout.tsx
│   └── page.tsx         # Home (no login required)
├── components/          # Topbar, Hero, UI components
├── lib/                  # auth, imageConvert helpers, utils
└── providers/
```

---

## Supported conversions

- **To WebP:** PNG, JPG/JPEG, GIF, BMP, TIFF  
- **To PNG:** WebP, JPEG, GIF, BMP, TIFF  
- **To JPG:** WebP, PNG, GIF, BMP, TIFF  

Used by the [all-in-one tool](/images/convert) and the [converter pages](/images/converter).

---

## Deploy

- **Vercel:** Connect the repo and set env vars. Image APIs run as serverless functions.
- **Docker:** A `Dockerfile` is included; build and run the image, and set env vars for auth if needed.

---

## License

This project is licensed under the **Apache License 2.0**. See [LICENSE](LICENSE) for the full text.

You may use, copy, modify, and distribute the software under the terms of the Apache License 2.0. You must include the license and any attribution notices when distributing the work or derivative works.
