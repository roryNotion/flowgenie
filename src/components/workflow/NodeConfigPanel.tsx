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

    // Validate required fields for email action
    if (selectedNode.data.type === 'action' && config.actionType === 'email') {
      if (!integration) {
        toast.error('Please select an email integration');
        return;
      }
      if (!config.toEmail?.trim()) {
        toast.error('To Email is required');
        return;
      }
      if (!config.subject?.trim()) {
        toast.error('Subject is required');
        return;
      }
      if (!config.body?.trim()) {
        toast.error('Email body is required');
        return;
      }
    }
    
    updateNode(selectedNode.id, {
      name,
      description,
      integration,
      config,
      status: 'configured',
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

  const getEmailIntegrations = () => {
    return [
      ...getIntegrationsByType('sendgrid'),
      ...getIntegrationsByType('resend')
    ];
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
            {selectedNode.data.type === 'action' && config.actionType === 'email' && (
              <div className="space-y-4">
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
                    {getEmailIntegrations().map((integration) => (
                      <option key={integration.id} value={integration.id}>
                        {integration.name} ({integration.type})
                      </option>
                    ))}
                  </select>
                  {integrationsLoading && (
                    <p className="mt-1 text-xs text-gray-500">Loading integrations...</p>
                  )}
                  {!integrationsLoading && getEmailIntegrations().length === 0 && (
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
                  <p className="mt-1 text-xs text-gray-500">
                    Use {{variableName}} to reference values from previous nodes
                  </p>
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
                    Use {{variableName}} to include data from previous steps
                  </p>
                </div>
              </div>
            )}
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