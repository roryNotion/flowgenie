import React, { useState, useEffect } from 'react';
import { X, Save, Database, Mail, Brain, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { useIntegrationStore } from '../../store/integrationStore';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { toast } from 'sonner';

const NodeConfigPanel: React.FC = () => {
  const selectedNode = useWorkflowStore((state) => state.selectedNode);
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const selectNode = useWorkflowStore((state) => state.selectNode);
  
  const { 
    integrations, 
    getIntegrationsByType,
    fetchIntegrations,
    loading: integrationsLoading 
  } = useIntegrationStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [integration, setIntegration] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});
  
  useEffect(() => {
    // Fetch integrations when panel opens
    fetchIntegrations();
  }, [fetchIntegrations]);

  useEffect(() => {
    if (selectedNode) {
      setName(selectedNode.data.name || '');
      setDescription(selectedNode.data.description || '');
      setIntegration(selectedNode.data.integration || '');
      setConfig(selectedNode.data.config || {});
    }
  }, [selectedNode]);
  
  const handleSave = () => {
    if (!selectedNode) return;
    
    updateNode(selectedNode.id, {
      name,
      description,
      integration,
      config,
    });

    toast.success('Node configuration saved');
  };
  
  const handleDelete = () => {
    if (!selectedNode) return;
    
    if (confirm('Are you sure you want to delete this node?')) {
      deleteNode(selectedNode.id);
      selectNode(null);
      toast.success('Node deleted');
    }
  };
  
  const handleClose = () => {
    selectNode(null);
  };
  
  const renderConfigFields = () => {
    if (!selectedNode) return null;
    
    switch (selectedNode.data.type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supabase Integration
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={integration}
                onChange={(e) => setIntegration(e.target.value)}
              >
                <option value="">Select integration...</option>
                {getIntegrationsByType('supabase').map((integration) => (
                  <option key={integration.id} value={integration.id}>
                    {integration.name}
                  </option>
                ))}
              </select>
              {integrationsLoading && (
                <p className="mt-1 text-xs text-gray-500">Loading integrations...</p>
              )}
              {!integrationsLoading && getIntegrationsByType('supabase').length === 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  No Supabase integrations found. Please create one first.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Table Name
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={config.table || ''}
                onChange={(e) => setConfig({ ...config, table: e.target.value })}
                placeholder="users"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={config.event || 'INSERT'}
                onChange={(e) => setConfig({ ...config, event: e.target.value })}
              >
                <option value="INSERT">Insert (new row)</option>
                <option value="UPDATE">Update (row changed)</option>
                <option value="DELETE">Delete (row removed)</option>
                <option value="*">Any change</option>
              </select>
            </div>
          </div>
        );
        
      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field to Check
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={config.field || ''}
                onChange={(e) => setConfig({ ...config, field: e.target.value })}
                placeholder="email"
              />
              <p className="mt-1 text-xs text-gray-500">
                The name of the field from previous steps to evaluate
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={config.operator || 'equals'}
                onChange={(e) => setConfig({ ...config, operator: e.target.value })}
              >
                <option value="equals">Equals</option>
                <option value="notEquals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="greaterThan">Greater Than</option>
                <option value="lessThan">Less Than</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={config.value || ''}
                onChange={(e) => setConfig({ ...config, value: e.target.value })}
                placeholder="Value to compare against"
              />
            </div>
          </div>
        );
        
      case 'aiblock':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OpenAI Integration
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={integration}
                onChange={(e) => setIntegration(e.target.value)}
              >
                <option value="">Select integration...</option>
                {getIntegrationsByType('openai').map((integration) => (
                  <option key={integration.id} value={integration.id}>
                    {integration.name}
                  </option>
                ))}
              </select>
              {integrationsLoading && (
                <p className="mt-1 text-xs text-gray-500">Loading integrations...</p>
              )}
              {!integrationsLoading && getIntegrationsByType('openai').length === 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  No OpenAI integrations found. Please create one first.
                </p>
              )}
            </div>
            
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
                Prompt
              </label>
              <textarea
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={config.prompt || ''}
                onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                placeholder="Enter your prompt here..."
                rows={5}
              />
              <p className="mt-1 text-xs text-gray-500">
                Use {'{{variableName}}'} syntax to include data from previous steps.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Output Variable Name
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={config.outputVariable || ''}
                onChange={(e) => setConfig({ ...config, outputVariable: e.target.value })}
                placeholder="ai_result"
              />
              <p className="mt-1 text-xs text-gray-500">
                The name of the variable to store the AI response
              </p>
            </div>
          </div>
        );
        
      case 'action':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={config.actionType || 'email'}
                onChange={(e) => setConfig({ ...config, actionType: e.target.value })}
              >
                <option value="email">Send Email</option>
                <option value="database">Update Database</option>
              </select>
            </div>
            
            {config.actionType === 'email' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Integration
                  </label>
                  <select
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={integration}
                    onChange={(e) => setIntegration(e.target.value)}
                  >
                    <option value="">Select integration...</option>
                    {[...getIntegrationsByType('sendgrid'), ...getIntegrationsByType('resend')].map((integration) => (
                      <option key={integration.id} value={integration.id}>
                        {integration.name}
                      </option>
                    ))}
                  </select>
                  {integrationsLoading && (
                    <p className="mt-1 text-xs text-gray-500">Loading integrations...</p>
                  )}
                  {!integrationsLoading && 
                   getIntegrationsByType('sendgrid').length === 0 && 
                   getIntegrationsByType('resend').length === 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      No email integrations found. Please create one first.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Email
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={config.toEmail || ''}
                    onChange={(e) => setConfig({ ...config, toEmail: e.target.value })}
                    placeholder="recipient@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={config.subject || ''}
                    onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                    placeholder="Email subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Body
                  </label>
                  <textarea
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={config.body || ''}
                    onChange={(e) => setConfig({ ...config, body: e.target.value })}
                    placeholder="Enter email content..."
                    rows={5}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use {'{{variableName}}'} syntax to include data from previous steps.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supabase Integration
                  </label>
                  <select
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={integration}
                    onChange={(e) => setIntegration(e.target.value)}
                  >
                    <option value="">Select integration...</option>
                    {getIntegrationsByType('supabase').map((integration) => (
                      <option key={integration.id} value={integration.id}>
                        {integration.name}
                      </option>
                    ))}
                  </select>
                  {integrationsLoading && (
                    <p className="mt-1 text-xs text-gray-500">Loading integrations...</p>
                  )}
                  {!integrationsLoading && getIntegrationsByType('supabase').length === 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      No Supabase integrations found. Please create one first.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={config.table || ''}
                    onChange={(e) => setConfig({ ...config, table: e.target.value })}
                    placeholder="users"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data to Write (JSON)
                  </label>
                  <textarea
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={config.data || ''}
                    onChange={(e) => setConfig({ ...config, data: e.target.value })}
                    placeholder='{ "status": "processed" }'
                    rows={5}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use {'{{variableName}}'} syntax to include data from previous steps.
                  </p>
                </div>
              </>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (!selectedNode) {
    return (
      <Card className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-400 text-sm">
          Select a node to configure
        </p>
      </Card>
    );
  }
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Configure Node</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
            className="w-8 h-8 p-0 rounded-full"
          >
            <X size={16} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto py-4">
        <div className="space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Node Name
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter node name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                rows={2}
              />
            </div>
          </div>
          
          <div className="border-t border-b py-4">
            {renderConfigFields()}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t bg-gray-50">
        <div className="w-full flex items-center justify-between">
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 size={14} />}
            onClick={handleDelete}
          >
            Delete
          </Button>
          
          <Button
            variant="primary"
            leftIcon={<Save size={14} />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default NodeConfigPanel;