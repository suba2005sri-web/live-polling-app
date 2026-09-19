# Live Polling Platform

A React/Vite frontend and Go/Gin backend for persistent, shareable live polls.

## Architecture

- MongoDB is the source of truth for users, polls, votes, and comments.
- Redis stores live result hashes and publishes poll update events.
- The Go WebSocket hub subscribes to Redis and broadcasts updates to every browser connected to a poll.
- The frontend uses REST for commands and a reconnecting WebSocket for live results.

## Local setup

1. Start MongoDB and Redis locally, or provide hosted connection URLs.
2. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI`, `REDIS_URL`, and a strong `JWT_SECRET`.
3. Copy `frontend/.env.example` to `frontend/.env` if the API is not on the default local URL.
4. Start the backend:

```powershell
cd backend
go mod tidy
go run .
```

5. Start the frontend in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The first account can create polls; audience members can vote without signing in.

## API and realtime endpoints

Authentication: `POST /api/auth/signup`, `POST /api/auth/login`, and `POST /api/auth/google`.

Polls: `POST /api/polls`, `GET /api/my-polls`, `GET /api/polls/:id`, `PUT /api/polls/:id`, `DELETE /api/polls/:id`.

Voting: `POST /api/polls/:id/vote`, `GET /api/polls/:id/results`.

Comments and reactions are available under `/api/polls/:id/comments`, `/api/comments/:id`, and `/api/polls/:id/reactions`.

Results clients connect to `ws://localhost:8080/api/ws/polls/:pollId`. When a vote is accepted, MongoDB is written first, Redis increments the result hash and publishes an event, and the hub broadcasts the updated counts.

## Google OAuth

Create a Google OAuth web client, configure its authorized origin and redirect settings, then set `GOOGLE_CLIENT_ID`. The frontend still needs a Google Identity Services credential flow to obtain an ID token; the backend `/api/auth/google` endpoint verifies that token with Google's token-info endpoint before creating or loading the account.

## Production

Use MongoDB Atlas and a managed Redis service, set `FRONTEND_URL` to the deployed origin, serve the frontend over HTTPS, and use the resulting `wss://` WebSocket URL. Do not commit `.env` files or credentials.