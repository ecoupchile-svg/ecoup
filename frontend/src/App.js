import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import { AuthPage } from '@/pages/AuthPage';
import { HomePage } from '@/pages/HomePage';
import { CreateRequestPage } from '@/pages/CreateRequestPage';
import { RequestDetailPage } from '@/pages/RequestDetailPage';
import { UploadEvidencePage } from '@/pages/UploadEvidencePage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { Loader2 } from 'lucide-react';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full h-[100dvh] flex items-center justify-center bg-gray-50">
        <Loader2 size={48} className="text-[#2BBFB3] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Componente para rutas públicas (solo accesibles si NO está autenticado)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full h-[100dvh] flex items-center justify-center bg-gray-50">
        <Loader2 size={48} className="text-[#2BBFB3] animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Ruta pública - Auth */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />

      {/* Rutas protegidas */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-request"
        element={
          <ProtectedRoute>
            <CreateRequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/request/:id"
        element={
          <ProtectedRoute>
            <RequestDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload-evidence/:id"
        element={
          <ProtectedRoute>
            <UploadEvidencePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: 'white',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '1rem',
              padding: '1rem',
              fontSize: '0.875rem',
              fontWeight: '600'
            }
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
