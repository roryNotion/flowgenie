import React from 'react';
import { Edit, Trash2, Database, Brain, Mail } from 'lucide-react';
import { Integration } from '../../types';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { formatDate, getIntegrationIcon } from '../../lib/utils';

interface IntegrationCardProps {
  integration: Integration;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onEdit,
  onDelete,
}) => {
  const getIcon = () => {
    switch (integration.type) {
      case 'supabase':
        return <Database size={18} />;
      case 'openai':
        return <Brain size={18} />;
      case 'sendgrid':
      case 'resend':
        return <Mail size={18} />;
      default:
        return null;
    }
  };
  
  const getTypeLabel = () => {
    switch (integration.type) {
      case 'supabase':
        return 'Supabase';
      case 'openai':
        return 'OpenAI';
      case 'sendgrid':
        return 'SendGrid';
      case 'resend':
        return 'Resend';
      default:
        return integration.type;
    }
  };
  
  const renderConfigSummary = () => {
    switch (integration.type) {
      case 'supabase':
        return (
          <div className="text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500">Project URL:</span>
              <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                {integration.config.projectUrl}
              </code>
            </div>
            {integration.config.tableName && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Table:</span>
                <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                  {integration.config.tableName}
                </code>
              </div>
            )}
          </div>
        );
        
      case 'openai':
        return (
          <div className="text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500">Model:</span>
              <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                {integration.config.model || 'gpt-3.5-turbo'}
              </code>
            </div>
          </div>
        );
        
      case 'sendgrid':
      case 'resend':
        return (
          <div className="text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500">From Email:</span>
              <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                {integration.config.fromEmail}
              </code>
            </div>
            {integration.config.fromName && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">From Name:</span>
                <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                  {integration.config.fromName}
                </code>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (integration.status) {
      case 'connected':
        return 'bg-success-500';
      case 'error':
        return 'bg-error-500';
      default:
        return 'bg-warning-500';
    }
  };

  const getStatusLabel = () => {
    switch (integration.status) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Error';
      default:
        return 'Pending';
    }
  };
  
  return (
    <Card 
      glass 
      className="h-full flex flex-col transition-all hover:shadow-md cursor-pointer"
      onClick={() => onEdit(integration.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-md text-white bg-${integration.type === 'openai' ? 'primary' : integration.type === 'supabase' ? 'error' : 'secondary'}-600`}>
              {getIcon()}
            </div>
            <div>
              <CardTitle className="text-base">{integration.name}</CardTitle>
              <div className="text-xs text-gray-500 mt-0.5">
                {getTypeLabel()}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(integration.id);
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="py-3 flex-1">
        {renderConfigSummary()}
        
        <div className="mt-2 text-xs text-gray-500">
          Created {formatDate(integration.createdAt)}
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-3">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
            <span className="text-sm">{getStatusLabel()}</span>
          </div>
          
          {integration.error && (
            <span className="text-xs text-error-600">
              {integration.error}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default IntegrationCard;