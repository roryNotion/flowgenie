import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Workflow, X } from 'lucide-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';

interface AuthPageProps {
  mode?: 'login' | 'signup';
}

const AuthPage: React.FC<AuthPageProps> = ({ mode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // If user is already authenticated, redirect to workflows
    if (user) {
      const returnTo = location.state?.from?.pathname || '/workflows';
      navigate(returnTo, { replace: true });
    }
  }, [user, navigate, location]);

  const handleBackToHome = () => {
    navigate('/', { replace: true });
  };

  // Custom auth callbacks to handle errors
  const authCallbacks = {
    onError: (error: Error) => {
      if (error.message.includes('User already registered')) {
        setError('This email is already registered. Please log in instead.');
      } else {
        setError(error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <button
        onClick={handleBackToHome}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
      >
        <X size={24} />
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center">
          <Workflow className="h-12 w-12 text-primary-600" />
          <span className="ml-3 text-2xl font-bold text-gray-900">FlowGenius</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                state={location.state} 
                className="text-primary-600 hover:text-primary-500"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link 
                to="/login" 
                state={location.state} 
                className="text-primary-600 hover:text-primary-500"
              >
                Log in
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#4f46e5',
                    brandAccent: '#4338ca',
                  },
                },
              },
            }}
            providers={[]}
            view={mode === 'login' ? 'sign_in' : 'sign_up'}
            redirectTo={`${window.location.origin}/workflows`}
            onlyThirdPartyProviders={false}
            showLinks={false}
            {...authCallbacks}
          />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;