import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import RootLayout from './layouts/RootLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import CreatePollPage from './pages/CreatePollPage';
import PollSharePage from './pages/PollSharePage';
import VotingPage from './pages/VotingPage';
import LiveResultsPage from './pages/LiveResultsPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            {/* 1. Landing / Home Page */}
            <Route index element={<LandingPage />} />

            {/* 2. Login Page */}
            <Route path="login" element={<LoginPage />} />

            {/* 3. Sign Up Page */}
            <Route path="signup" element={<SignUpPage />} />

            {/* 4. Create Poll Page */}
            <Route path="create" element={<CreatePollPage />} />

            {/* 5. Poll Share Page */}
            <Route path="share/:id" element={<PollSharePage />} />

            {/* 6. Audience Voting Page */}
            <Route path="vote/:id" element={<VotingPage />} />

            {/* 7. Live Results Page */}
            <Route path="results/:id" element={<LiveResultsPage />} />

            {/* 8. Dashboard Page */}
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Fallback 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
