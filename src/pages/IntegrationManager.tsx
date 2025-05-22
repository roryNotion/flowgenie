import React, { useState, useEffect } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { useIntegrationStore } from '../store/integrationStore';
import { Button } from '../components/ui/Button';
import IntegrationCard from '../components/integration/IntegrationCard';
import IntegrationForm from '../components/integration/IntegrationForm';
import IntegrationSelectionModal from '../components/integration/IntegrationSelectionModal';
import { Integration, IntegrationType } from '../types';

const IntegrationManager: React.FC = () => {
  const { 
    integrations, 
    createIntegration, 
    updateIntegration, 
    deleteIntegration,
    getIntegrationById,
    fetchIntegrations,
    loading,
    error
  } = useIntegrationStore();
  
  const [showForm, setShowForm] = useState(false);
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(null);
  const [editingIntegrationId, setEditingIntegrationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleCreateIntegration = async (data: {
    name: string;
    type: IntegrationType;
    config: Record<string, any>;
    keys?: Record<string, string>;
  }) => {
    try {
      await createIntegration(data.type, data.name, data.config, data.keys);
      setShowForm(false);
      setSelectedType(null);
    } catch (error) {
      console.error('Failed to create integration:', error);
    }
  };
  
  const handleUpdateIntegration = async (data: {
    name: string;
    type: IntegrationType;
    config: Record<string, any>;
    keys?: Record<string, string>;
  }) => {
    if (editingIntegrationId) {
      try {
        await updateIntegration(editingIntegrationId, {
          name: data.name,
          config: data.config,
        });
        setEditingIntegrationId(null);
        setShowForm(false);
      } catch (error) {
        console.error('Failed to update integration:', error);
      }
    }
  };
  
  const handleEditIntegration = (id: string) => {
    // Validate UUID format before setting editingIntegrationId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('Invalid integration ID format');
      return;
    }
    setEditingIntegrationId(id);
    setShowForm(true);
  };
  
  const handleDeleteIntegration = async (id: string) => {
    if (confirm('Are you sure you want to delete this integration?')) {
      try {
        await deleteIntegration(id);
      } catch (error) {
        console.error('Failed to delete integration:', error);
      }
    }
  };
  
  const handleCancelForm = () => {
    setEditingIntegrationId(null);
    setShowForm(false);
    setSelectedType(null);
  };

  const handleTypeSelection = (type: IntegrationType) => {
    setSelectedType(type);
    setShowTypeSelection(false);
    setShowForm(true);
  };
  
  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || integration.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Get the integration safely for editing
  const getEditingIntegration = () => {
    if (!editingIntegrationId) return undefined;
    return getIntegrationById(editingIntegrationId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-error-50 text-error-700 rounded-md">
        Error loading integrations: {error}
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-500 mt-1">
            Manage your third-party integrations securely
          </p>
        </div>
        
        <Button
          variant="primary"
          leftIcon={<PlusCircle size={16} />}
          onClick={() => setShowTypeSelection(true)}
        >
          New Integration
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">Filter by:</span>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md shadow-sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="supabase">Supabase</option>
              <option value="openai">OpenAI</option>
              <option value="sendgrid">SendGrid</option>
              <option value="resend">Resend</option>
            </select>
          </div>
        </div>
      </div>
      
      {showTypeSelection && (
        <IntegrationSelectionModal
          onClose={() => setShowTypeSelection(false)}
          onSelect={handleTypeSelection}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <IntegrationForm
            integration={getEditingIntegration()}
            selectedType={selectedType}
            onSave={editingIntegrationId ? handleUpdateIntegration : handleCreateIntegration}
            onCancel={handleCancelForm}
          />
        </div>
      )}
      
      {filteredIntegrations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <PlusCircle size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No integrations found</h3>
          <p className="text-gray-500 mt-1 mb-4">
            {searchTerm || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first integration'}
          </p>
          {!searchTerm && filterType === 'all' && (
            <Button
              variant="primary"
              leftIcon={<PlusCircle size={16} />}
              onClick={() => setShowTypeSelection(true)}
            >
              Add Integration
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onEdit={handleEditIntegration}
              onDelete={handleDeleteIntegration}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default IntegrationManager;