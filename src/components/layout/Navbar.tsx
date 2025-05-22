import React, { useState } from 'react';
import { Workflow, CircleUser, PanelLeft, BookOpen, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWorkflowStore } from '../../store/workflowStore';
import { useAuth } from '../auth/AuthProvider';

interface NavbarProps {
  toggleLeftSidebar: () => void;
  activeWorkflowName: string;
}

const Navbar: React.FC<NavbarProps> = ({ toggleLeftSidebar, activeWorkflowName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const currentWorkflow = useWorkflowStore((state) => state.currentWorkflow);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const isWorkflowBuilder = location.pathname.includes('/builder');
  
  const handleLogout = async () => {
    await signOut();
  };
  
  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={toggleLeftSidebar}
          >
            <PanelLeft size={20} />
          </Button>
          
          <div className="flex items-center">
            <Workflow className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">FlowGenius</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/workflows')}
              className={location.pathname === '/workflows' ? 'bg-gray-100' : ''}
            >
              Workflows
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/integrations')}
              className={location.pathname === '/integrations' ? 'bg-gray-100' : ''}
            >
              Integrations
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/logs')}
              className={location.pathname === '/logs' ? 'bg-gray-100' : ''}
            >
              Logs
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm"
            leftIcon={<BookOpen size={16} />}
          >
            Docs
          </Button>
          
          <div className="w-0.5 h-6 bg-gray-200 mx-2"></div>
          
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              className="gap-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <CircleUser size={16} />
              <span>{user?.email}</span>
            </Button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                <button 
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isWorkflowBuilder && currentWorkflow && (
        <div className="flex items-center justify-between px-4 h-12 bg-gray-50 border-b">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{currentWorkflow.name}</span>
            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
              Active
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              Share
            </Button>
            <Button variant="primary" size="sm">
              Save
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;