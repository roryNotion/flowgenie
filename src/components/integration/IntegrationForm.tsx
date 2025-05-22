import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Database, Brain, Mail, Loader } from 'lucide-react';
import { Integration, IntegrationType } from '../../types';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { INTEGRATION_REGISTRY } from '../../lib/integrationRegistry';

interface IntegrationFormProps {
  integration?: Integration;
  selectedType?: IntegrationType | null;
  onSave: (data: {
    name: string;
    type: IntegrationType;
    config: Record<string, any>;
    keys?: Record<string, string>;
  }) => void;
  onCancel: () => void;
}

const IntegrationForm: React.FC<IntegrationFormProps> = ({
  integration,
  selectedType,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<IntegrationType>('supabase');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  
  useEffect(() => {
    if (integration) {
      setName(integration.name);
      setType(integration.type);
      setConfig(integration.config);
    } else if (selectedType) {
      setType(selectedType);
    }
  }, [integration, selectedType]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      name,
      type,
      config,
      keys,
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await INTEGRATION_REGISTRY[type].test({
        ...config,
        ...keys,
      });
      
      setTestResult({
        success: result.success,
        error: result.error,
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test connection',
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  const renderTypeSpecificFields = () => {
    switch (type) {
      case 'supabase':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project URL
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={config.projectUrl || ''}
                onChange={(e) => setConfig({ ...config, projectUrl: e.target.value })}
                placeholder="https://your-project.supabase.co"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Table Name (Optional)
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={config.tableName || ''}
                onChange={(e) => setConfig({ ...config, tableName: e.target.value })}
                placeholder="users"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supabase Key
              </label>
              <input
                type="password"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={keys.supabaseKey || ''}
                onChange={(e) => setKeys({ ...keys, supabaseKey: e.target.value })}
                placeholder="Your Supabase key"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This key will be securely encrypted and stored
              </p>
            </div>
          </>
        );
        
      case 'openai':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={config.model || 'gpt-3.5-turbo'}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={keys.openaiKey || ''}
                onChange={(e) => setKeys({ ...keys, openaiKey: e.target.value })}
                placeholder="Your OpenAI API key"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This key will be securely encrypted and stored
              </p>
            </div>
          </>
        );
        
      case 'sendgrid':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Email
              </label>
              <input
                type="email"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={config.fromEmail || ''}
                onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                placeholder="notifications@example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Name (Optional)
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={config.fromName || ''}
                onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                placeholder="Notification Service"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SendGrid API Key
              </label>
              <input
                type="password"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={keys.sendgridKey || ''}
                onChange={(e) => setKeys({ ...keys, sendgridKey: e.target.value })}
                placeholder="Your SendGrid API key"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This key will be securely encrypted and stored
              </p>
            </div>
          </>
        );
        
      case 'resend':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Email
              </label>
              <input
                type="email"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={config.fromEmail || ''}
                onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                placeholder="notifications@example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Name (Optional)
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={config.fromName || ''}
                onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                placeholder="Notification Service"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resend API Key
              </label>
              <input
                type="password"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={keys.resendKey || ''}
                onChange={(e) => setKeys({ ...keys, resendKey: e.target.value })}
                placeholder="Your Resend API key"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This key will be securely encrypted and stored
              </p>
            </div>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader className="bg-white border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <PlusCircle size={18} className="mr-2" />
              {integration ? 'Edit Integration' : 'New Integration'}
            </CardTitle>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              onClick={onCancel}
              className="w-8 h-8 p-0 rounded-full"
            >
              <X size={16} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="py-4">
          <div className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Integration Name
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Integration"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Integration Type
                </label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={type}
                  onChange={(e) => setType(e.target.value as IntegrationType)}
                  disabled={!!integration} // Can't change type of existing integration
                >
                  <option value="supabase">Supabase</option>
                  <option value="openai">OpenAI</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="resend">Resend</option>
                </select>
              </div>
              
              <div className="border-t pt-4 space-y-4">
                {renderTypeSpecificFields()}
              </div>
            </div>

            {testResult && (
              <div className={`p-3 rounded-md ${
                testResult.success 
                  ? 'bg-success-50 text-success-700' 
                  : 'bg-error-50 text-error-700'
              }`}>
                {testResult.success 
                  ? 'Connection successful!' 
                  : `Connection failed: ${testResult.error}`
                }
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 border-t">
          <div className="w-full flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex-1"
            >
              {isTesting ? (
                <>
                  <Loader size={14} className="mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Save size={14} />}
              className="flex-1"
            >
              {integration ? 'Update' : 'Create'} Integration
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default IntegrationForm;