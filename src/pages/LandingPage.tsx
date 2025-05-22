import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Workflow, Zap, Brain, Database } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../components/auth/AuthProvider';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/workflows', { replace: true });
    } else {
      navigate('/signup');
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Workflow className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">FlowGenius</span>
          </div>
          
          <div>
            {user ? (
              <Button
                variant="primary"
                onClick={() => navigate('/workflows')}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={handleLogin}
                >
                  Log In
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGetStarted}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Automate Your Work with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Build powerful automation workflows without code. Connect your tools, automate tasks, and let AI handle the heavy lifting.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={handleGetStarted}
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Automate
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Workflow size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Visual Builder</h3>
              <p className="text-gray-600">
                Drag and drop interface to create workflows in minutes
              </p>
            </div>
            
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-secondary-100 text-secondary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
              <p className="text-gray-600">
                Leverage AI to process and analyze your data
              </p>
            </div>
            
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-error-100 text-error-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time</h3>
              <p className="text-gray-600">
                Instant execution and real-time monitoring
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users automating their work with FlowGenius
          </p>
          <Button
            variant="outline"
            size="lg"
            className="bg-white text-primary-600 hover:bg-gray-100"
            onClick={handleGetStarted}
          >
            Start Building Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;