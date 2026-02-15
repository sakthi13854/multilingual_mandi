import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthPage } from './pages/AuthPage'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

// Dashboard placeholder components
const VendorDashboard = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Vendor Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Vendor dashboard features will be implemented in future tasks.</p>
      </div>
    </div>
  </div>
);

const BuyerDashboard = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Buyer Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Buyer dashboard features will be implemented in future tasks.</p>
      </div>
    </div>
  </div>
);

function AppContent() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/vendor/dashboard" element={
        <ProtectedRoute>
          <VendorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/buyer/dashboard" element={
        <ProtectedRoute>
          <BuyerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AppContent />
      </div>
    </AuthProvider>
  )
}

export default App