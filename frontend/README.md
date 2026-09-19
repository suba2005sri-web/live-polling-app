# Live Polling Tool - Frontend

Frontend application for the GUVI Developer Internship **Live Polling Tool** assignment. Built with **React**, **Vite**, and **Vanilla CSS**.

---

## 🌟 Key Features

1. **Landing / Home Page**:
   - Modern SaaS UI with interactive live polling preview.
   - Quick "Join Poll by ID/Link" bar.
   - Navigation CTAs for Poll Creation, Exploration, and Authentication.

2. **Authentication Pages (UI Only)**:
   - **Login Page**: Client-side validation with a one-click **"Fill Demo"** button (`demo@guvi.in` / `password123`) for evaluators.
   - **Sign Up Page**: Full client-side validation (Name, Email, Password, Confirm Password).
   - Designed for seamless connection to future `POST /api/auth/signup` and `POST /api/auth/login`.

3. **Create Poll Page**:
   - Dynamic option builder with Add / Remove controls.
   - Validation ensuring non-empty question, minimum 2 options, non-empty options, and prevention of duplicate options.
   - **"Load Example"** button pre-filling the prompt's programming language poll.

4. **Poll Share Page**:
   - Instant shareable link with one-click **Copy Link** and toast notification.
   - Native Web Share API integration.
   - **Live QR Code Generator** allowing mobile devices to scan and vote immediately.
   - Quick access to "View Poll (Vote)" and "View Live Results".

5. **Audience Voting Page**:
   - Distraction-free, accessible voting card.
   - Choice selection with active ring indicators and keyboard accessibility.
   - Empty submission prevention.
   - Post-vote confirmation state with confetti animation and direct navigation to live results.

6. **Live Results Page**:
   - Pulsing **"● LIVE"** status beacon.
   - Total votes counter and dynamic percentage progress bars.
   - Automated highlight of the leading option.
   - **"Simulate Stream"** button allowing reviewers to evaluate live incoming vote animations and counter changes without opening multiple windows.

7. **Polls Dashboard**:
   - SaaS metrics cards: Total Polls, Total Votes Collected, Active Sessions.
   - Filter by status (All, Active, Closed) and search by question keyword.
   - Management actions: Vote, Live Results, Share, and Delete with confirmation modal.
   - **"Reset Demo Data"** button to restore initial state at any time.

---

## 🛠 Tech Stack & Architecture

- **Core**: React 19 + Vite
- **Routing**: `react-router-dom` (v7)
- **Styling**: Vanilla CSS Design System with CSS Variables, Dark/Glassmorphic Palette, and responsive grid layouts (`src/index.css`)
- **Icons**: `lucide-react`
- **QR Code**: `qrcode` canvas generator
- **Feedback**: `canvas-confetti` + custom accessible `ToastProvider`
- **API & Mock Layer**: `src/services/api.js` + `src/mock/mockData.js`

---

## 🚀 How to Run the Frontend

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment (Optional)
The application includes `.env` and `.env.example`:
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_USE_MOCK=true
```
- While developing or evaluating frontend-only, keep `VITE_USE_MOCK=true`.
- When the Go/Gin backend is ready, set `VITE_USE_MOCK=false`.

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🔌 Connecting to the Future Go + Gin Backend

The frontend was designed from day one to integrate with the Go/Gin backend with zero frontend code refactoring:

1. **Centralized Service Contract (`src/services/api.js`)**:
   All HTTP calls are routed through `api.js` using the following exact Go/Gin endpoint signatures:
   - `POST /api/auth/signup` -> `{ name, email, password }`
   - `POST /api/auth/login` -> `{ email, password }`
   - `POST /api/polls` -> `{ question, options: string[] }`
   - `GET  /api/polls/:id`
   - `POST /api/polls/:id/vote` -> `{ optionId }`
   - `GET  /api/polls/:id/results`
   - `GET  /api/polls`
   - `PUT  /api/polls/:id`
   - `DELETE /api/polls/:id`

2. **Switching to the Real Backend**:
   Simply update your `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   VITE_USE_MOCK=false
   ```
   The `request()` helper in `api.js` will immediately start making real HTTP requests with JWT `Authorization: Bearer <token>` headers.

3. **Connecting Realtime Updates (Go Gin + Redis Pub/Sub)**:
   The `useLivePollResults` hook (`src/hooks/useLivePollResults.js`) contains the prepared connection logic for:
   - Server-Sent Events (SSE) via `GET /api/polls/:id/live`
   - Or WebSockets via `ws://localhost:8080/api/polls/:id/live`
   When the Go backend publishes Redis messages to this stream, the hook updates the state automatically without page reloads.
