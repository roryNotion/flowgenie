import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import 'reactflow/dist/style.css';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import WorkflowBuilder from './pages/WorkflowBuilder';
import IntegrationManager from './pages/IntegrationManager';
import WorkflowList from './pages/WorkflowList';
import LogsPage from './pages/LogsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import Navbar from './components/layout/Navbar';
import { useWorkflowStore } from './store/workflowStore';

function App() {
  const [leftSidebarOpen, setLeftSidebarOpen] = React.useState(true);
  const currentWorkflow = useWorkflowStore((state) => state.currentWorkflow);
  const location = useLocation();
  
  const toggleLeftSidebar = () => {
    setLeftSidebarOpen(!leftSidebarOpen);
  };

  // Check if we're on an auth page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          <AuthPage key="login" mode="login" />
        } />
        <Route path="/signup" element={
          <AuthPage key="signup" mode="signup" />
        } />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/workflows" element={
            <div className="flex flex-col h-screen bg-gray-50">
              <Navbar 
                toggleLeftSidebar={toggleLeftSidebar} 
                activeWorkflowName={currentWorkflow?.name || ''}
              />
              <WorkflowList />
            </div>
          } />
          
          <Route path="/builder/:id?" element={
            <div className="flex flex-col h-screen bg-gray-50">
              <Navbar 
                toggleLeftSidebar={toggleLeftSidebar} 
                activeWorkflowName={currentWorkflow?.name || ''}
              />
              <WorkflowBuilder />
            </div>
          } />
          
          <Route path="/integrations" element={
            <div className="flex flex-col h-screen bg-gray-50">
              <Navbar 
                toggleLeftSidebar={toggleLeftSidebar} 
                activeWorkflowName={currentWorkflow?.name || ''}
              />
              <IntegrationManager />
            </div>
          } />
          
          <Route path="/logs" element={
            <div className="flex flex-col h-screen bg-gray-50">
              <Navbar 
                toggleLeftSidebar={toggleLeftSidebar} 
                activeWorkflowName={currentWorkflow?.name || ''}
              />
              <LogsPage />
            </div>
          } />
          
          <Route path="/analytics" element={
            <div className="flex flex-col h-screen bg-gray-50">
              <Navbar 
                toggleLeftSidebar={toggleLeftSidebar} 
                activeWorkflowName={currentWorkflow?.name || ''}
              />
              <AnalyticsPage />
            </div>
          } />
        </Route>

        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;