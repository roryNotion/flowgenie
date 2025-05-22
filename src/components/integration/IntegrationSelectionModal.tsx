import React from 'react';
import { X, Database, Brain, Mail } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { IntegrationType } from '../../types';

interface IntegrationSelectionModalProps {
  onClose: () => void;
  onSelect: (type: IntegrationType) => void;
}

const integrationTypes = [
  {
    type: 'supabase' as IntegrationType,
    name: 'Supabase',
    description: 'Connect to your Supabase database for real-time data access and storage',
    icon: Database,
    color: 'error',
  },
  {
    type: 'openai' as IntegrationType,
    name: 'OpenAI',
    description: 'Leverage AI capabilities for text analysis, generation, and processing',
    icon: Brain,
    color: 'primary',
  },
  {
    type: 'sendgrid' as IntegrationType,
    name: 'SendGrid',
    description: 'Send transactional and marketing emails reliably at scale',
    icon: Mail,
    color: 'secondary',
  },
  {
    type: 'resend' as IntegrationType,
    name: 'Resend',
    description: 'Modern email delivery service with powerful APIs and analytics',
    icon: Mail,
    color: 'secondary',
  },
];

const IntegrationSelectionModal: React.FC<IntegrationSelectionModalProps> = ({
  onClose,
  onSelect,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="bg-white border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Choose Integration Type</CardTitle>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="w-8 h-8 p-0 rounded-full"
            >
              <X size={16} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrationTypes.map((integration) => {
              const Icon = integration.icon;
              return (
                <div
                  key={integration.type}
                  className="border rounded-lg p-4 hover:border-primary-500 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onSelect(integration.type)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-${integration.color}-100 text-${integration.color}-600`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium">{integration.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationSelectionModal;