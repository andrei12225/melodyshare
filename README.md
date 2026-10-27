# MelodyShare

A web app for viewing your Spotify listening statistics and connecting with friends.

---

## About

MelodyShare integrates with your Spotify account to give you insights into your listening habits: top tracks, artists and genres, recently played tracks and playlists. You can also add friends, see who's on the platform, and chat — including sharing songs straight from Spotify search.

## Features

- **Personalized Dashboard**: Top tracks, artists and genres over customizable time ranges (4 weeks, 6 months, all time).
- **Listening History**: Recently played tracks and listening statistics.
- **Playlists**: Browse your Spotify playlists.
- **Friends System**: Send friend requests, accept invitations and manage your friends list.
- **Real-time Chat**: Message friends and share songs, with live updates.
- **Responsive Design**: Works on desktop and mobile.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript, TailwindCSS 4
- **Database**: PostgreSQL 18 (Docker) with Drizzle ORM
- **Authentication**: Spotify OAuth (authorization code flow), server-side sessions
- **Realtime**: Server-Sent Events backed by Postgres `LISTEN`/`NOTIFY`
- **Music Data**: Spotify Web API (proxied through the server; tokens never reach the browser)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.9 or newer
- [Docker](https://www.docker.com/) with Docker Compose
- A [Spotify Developer](https://developer.spotify.com/dashboard) app

### 1. Configure Spotify

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) (select **Web API**).
2. Add the redirect URI `http://127.0.0.1:3000/api/auth/callback`.
   Spotify does not accept `localhost` redirect URIs — use the loopback IP, and open the app at `http://127.0.0.1:3000`.
3. While the app is in development mode, add every Spotify account that should be able to sign in under **User Management**.

### 2. Configure the environment

```bash
cp .env.example .env
```

Fill in `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`. The Postgres defaults work out of the box.

### 3. Run it

**Development** (Postgres in Docker, Next.js on your machine):

```bash
npm install
npm run db:up      # start Postgres
npm run dev        # http://127.0.0.1:3000
```

**Everything in Docker:**

```bash
docker compose up -d --build   # http://127.0.0.1:3000
```

Database migrations are applied automatically when the server starts.

### Database scripts

| Command               | Description                                         |
| --------------------- | --------------------------------------------------- |
| `npm run db:up`       | Start the Postgres container                        |
| `npm run db:down`     | Stop the containers (data is kept in a volume)      |
| `npm run db:generate` | Generate a migration after editing `src/lib/db/schema.ts` |
| `npm run db:migrate`  | Apply migrations manually                           |
| `npm run db:studio`   | Open Drizzle Studio to browse the database          |

To wipe the database: `docker compose down -v`.

## Project Structure

```
melodyshare/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # Route handlers (auth, friends, messages, events, Spotify proxy)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/          # React client components
│   ├── lib/
│   │   ├── db/              # Drizzle schema and client
│   │   ├── auth.ts          # Sessions and cookies
│   │   ├── events.ts        # Postgres LISTEN/NOTIFY fan-out
│   │   ├── realtime.ts      # Client-side SSE hook
│   │   ├── spotify.ts       # Client Spotify API helpers
│   │   └── spotify-server.ts# OAuth and token refresh
│   └── instrumentation.ts   # Runs migrations on startup
├── drizzle/                 # SQL migrations
├── public/                  # Static assets
├── Dockerfile
└── docker-compose.yml
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [Spotify](https://www.spotify.com/) for the Web API
- [TheAudioDB](https://www.theaudiodb.com/) for artist genre data
