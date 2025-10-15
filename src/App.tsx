import { type FC, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import { WalletProvider } from './contexts/WalletContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import TaskListPage from './pages/TaskListPage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import CreateTaskPage from './pages/CreateTaskPage';
import TaskCreatePage from './pages/TaskCreatePage';
import MyTasksPage from './pages/MyTasksPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import TaskTemplatePage from './pages/TaskTemplatePage';
import ChatPage from './pages/ChatPage';
import WalletPage from './pages/WalletPage';
import WalletSetupPage from './pages/WalletSetupPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoadingSpinner from './components/LoadingSpinner';
import Layout from './components/Layout';
import ProfileSetupPage from './pages/ProfileSetupPage';

// Protected Route Component
const ProtectedRoute: FC<{ children: ReactNode; requireAuth?: boolean }> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAuth && user && !userProfile) {
    return <ProfileSetupPage />; // Use fixed ProfileSetupPage
  }

  if (!requireAuth && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Admin Route Component
const AdminRoute: FC<{ children: ReactNode }> = ({ children }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin (you'll need to add this to your user profile)
  if (!userProfile?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <WalletProvider>
          <PaymentProvider>
            <Router>
            <div className="min-h-screen bg-slate-900">
              <Routes>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <LandingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <LoginPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <SignupPage />
                </ProtectedRoute>
              } 
            />

            {/* Protected Routes */}
            <Route 
              path="/profile-setup" 
              element={
                <ProtectedRoute>
                  <ProfileSetupPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tasks" 
              element={
                <ProtectedRoute>
                  <TaskProvider>
                    <Layout>
                      <TaskListPage />
                    </Layout>
                  </TaskProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tasks/:id" 
              element={
                <ProtectedRoute>
                  <TaskProvider>
                    <Layout>
                      <TaskDetailsPage />
                    </Layout>
                  </TaskProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tasks/create" 
              element={
                <ProtectedRoute>
                  <TaskProvider>
                    <Layout>
                      <TaskCreatePage />
                    </Layout>
                  </TaskProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-task" 
              element={
                <ProtectedRoute>
                  <TaskProvider>
                    <CreateTaskPage />
                  </TaskProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ChatPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat/:taskId" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ChatPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/wallet" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <WalletPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/wallet-setup" 
              element={
                <ProtectedRoute>
                  <WalletSetupPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment/callback" 
              element={
                <ProtectedRoute>
                  <PaymentCallbackPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-tasks" 
              element={
                <ProtectedRoute>
                  <TaskProvider>
                    <Layout>
                      <MyTasksPage />
                    </Layout>
                  </TaskProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/task-templates" 
              element={
                <ProtectedRoute>
                  <TaskProvider>
                    <Layout>
                      <TaskTemplatePage />
                    </Layout>
                  </TaskProvider>
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <Layout>
                    <AdminDashboardPage />
                  </Layout>
                </AdminRoute>
              } 
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
              },
            }}
          />
          
          {/* reCAPTCHA container for phone auth */}
          <div id="recaptcha-container"></div>
            </div>
          </Router>
          </PaymentProvider>
        </WalletProvider>
      </TaskProvider>
    </AuthProvider>
  );
}

export default App;
