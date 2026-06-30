# GeoBoard

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

**GeoBoard** is a full‑stack, real‑time dashboard that surfaces weather, news, currency rates, and location‑aware data — all from a single, modern interface. Designed with production‑grade security, background job scheduling, Redis caching, and a premium dark‑mode UI.

---

## Features

- **🌦️ Live Weather** — Current conditions, hourly forecasts, and animated weather cards powered by OpenWeatherMap.
- **📰 Curated News** — Category‑driven news feed with automatic background prefetching.
- **💱 Currency Converter** — Real‑time exchange rates with Redis‑backed caching.
- **📍 Location Services** — Auto IP detection or manual location picker with reverse geocoding via Nominatim.
- **🔐 Full Authentication** — Email/password registration & login, OAuth (Google), session management, and secure cookie‑based tokens.
- **🔁 Password Reset** — Forgot/reset password flow with cryptographically random tokens, hashed storage, and 20‑minute expiry.
- **🛡️ Security Hardened** — Helmet headers, rate limiting, bcrypt hashing, session invalidation on password change, and input validation via Zod.
- **🎨 Premium UI** — Glassmorphic cards, animated backgrounds, live password strength meter, and avatar picker with 18 unique icons.
- **⚙️ User Settings** — Profile editing, display name cooldown (10‑day limit), password changes with 3‑hour cooldown, and manual location override.

---

## Screenshots

> 📸 *Screenshots coming soon.*

| Dashboard | Weather | Settings |
|:---------:|:-------:|:--------:|
| *(placeholder)* | *(placeholder)* | *(placeholder)* |

---

## Tech Stack

### Frontend
| Technology   | Purpose                       |
|-------------|-------------------------------|
| React 18    | UI framework                  |
| TypeScript  | Type safety                   |
| Vite        | Build tool & dev server       |
| Framer Motion | Animations & transitions    |
| React Router | Client‑side routing          |
| Lucide React | Icon library                 |
| Zod          | Schema validation (shared)   |

### Backend
| Technology          | Purpose                        |
|--------------------|--------------------------------|
| Node.js + Express  | REST API framework              |
| TypeScript         | Type safety                     |
| Prisma ORM         | Database access & migrations    |
| PostgreSQL         | Primary datastore               |
| Redis (ioredis)    | Caching & session store         |
| BullMQ             | Background job queue            |
| JSON Web Tokens    | Auth tokens                     |
| bcryptjs           | Password hashing                |
| Zod                | Request validation              |
| Resend             | Transactional email             |

### DevOps
| Tool       | Purpose                   |
|-----------|---------------------------|
| Docker     | Containerization          |
| Docker Compose | Local orchestration  |
| Vercel / Railway | Deployment         |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Frontend (Vite + React)                     │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Dashboard │  │  Weather   │  │  News    │  │    Settings       │  │
│  └──────────┘  └────────────┘  └──────────┘  └──────────────────┘  │
│                         │  AuthContext  │                            │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ HTTP (fetch, credentials: include)
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Express REST API (server/)                      │
│  ┌──────┐ ┌────────┐ ┌─────────┐ ┌───────┐ ┌──────┐ ┌──────────┐  │
│  │ Auth │ │ Users  │ │ Weather │ │ News  │ │Currency││Dashboard │  │
│  └──┬───┘ └───┬────┘ └────┬────┘ └───┬───┘ └──┬───┘ └────┬─────┘  │
│     │         │           │          │        │           │        │
│     └─────────┴───────────┴──────────┴────────┴───────────┘        │
│                              │                                      │
│                      ┌───────┴────────┐                             │
│                      │  Prisma ORM    │                             │
│                      └───────┬────────┘                             │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │    PostgreSQL DB     │
                    └─────────────────────┘
```

---

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- npm or yarn

### Clone & Setup
```bash
git clone https://github.com/yourusername/geoboard.git
cd geoboard
npm install
cd server && npm install
cd ..
```

### Environment Variables

Create `geoboard-project/.env.local` (frontend) and `geoboard-project/server/.env` (backend).

**Backend (`server/.env`):**
```env
# Server
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/geoboard

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret-change-in-production

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@geoboard.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Database Setup
```bash
cd server
npx prisma generate
npx prisma db push
```

### Run Locally
```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd geoboard-project
npm run dev
```

The frontend starts at `http://localhost:5173`, the backend at `http://localhost:4000`.

---

## Docker

A `docker-compose.yml` can be used to run the entire stack:

```bash
docker compose up -d
```

Make sure your `.env` files are configured before running.

---

## Deployment

### Vercel (Frontend)
1. Connect your repository to Vercel.
2. Set the root directory to `geoboard-project`.
3. Add the `VITE_API_URL` environment variable.
4. Deploy.

### Railway / Fly.io (Backend)
1. Set the server directory as the build root.
2. Configure the required environment variables.
3. Run the database migration during deploy:
   ```bash
   npx prisma generate && npx prisma db push
   ```

---

## Security Highlights

- **Password hashing** — bcrypt with cost factor 12.
- **Session tokens** — JWT stored in httpOnly cookies (not localStorage).
- **Password change** — invalidates all other active sessions.
- **Rate limiting** — 100 requests per 15‑minute window per IP.
- **Helmet** — security headers (CSP, X‑Frame‑Options, etc.).
- **Input validation** — Zod schemas on every endpoint.
- **Password strength** — enforces 10+ chars, mixed case, numbers, special chars, common password blacklist.
- **Reset tokens** — SHA‑256 hashed before storage, 20‑minute expiry.

---

## Future Improvements

- [ ] Two‑factor authentication (TOTP).
- [ ] WebSocket‑based real‑time updates.
- [ ] Mobile responsive refinements.
- [ ] Dark/light theme toggle.
- [ ] Unit & integration test suite.
- [ ] CI/CD pipeline (GitHub Actions).
- [ ] API documentation (Swagger/OpenAPI).
- [ ] User admin panel.
- [ ] Export dashboard data (PDF/CSV).

---

## License

MIT © GeoBoard

---

## Author

Built with ❤️ by the GeoBoard team.