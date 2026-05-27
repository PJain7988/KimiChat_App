import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './context/authStore';

import Landing from './pages/Landing';
import Auth    from './pages/Auth';
import MainApp from './pages/MainApp';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/auth" replace />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user ? <Navigate to="/app" replace /> : children;
};

export default function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background:   'var(--bg-card)',
            color:        'var(--text)',
            border:       '1px solid var(--border)',
            borderRadius: '12px',
            fontFamily:   'var(--font-body)',
            fontSize:     '14px',
          },
          success: { iconTheme: { primary: 'var(--teal)', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ff4444',     secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/"    element={<Landing />} />
        <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />

        
        <Route path="/auth/callback" element={<Auth />} />

        <Route path="/app/*" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
        <Route path="*"      element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}