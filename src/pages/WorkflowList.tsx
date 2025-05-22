import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Calendar, MoreVertical, Play, Edit, Trash2, Copy } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { formatDate } from '../lib/utils';
import CreateWorkflowModal from '../components/workflow/CreateWorkflowModal';

const WorkflowList: React.FC = () => {
  const navigate = useNavigate();
  const { 
    workflows, 
    createWorkflow, 
    deleteWorkflow, 
    setCurrentWorkflow,
    fetchWorkflows,
    loading,
    error 
  } = useWorkflowStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);
  
  const handleCreateWorkflow = async (name: string, description?: string) => {
    try {
      const workflow = await createWorkflow(name, description);
      setShowCreateModal(false);
      navigate(`/builder/${workflow.id}`);
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };
  
  const handleDeleteWorkflow = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteWorkflow(id);
      } catch (error) {
        console.error('Failed to delete workflow:', error);
      }
    }
  };
  
  const handleEditWorkflow = async (id: string) => {
    try {
      await setCurrentWorkflow(id);
      navigate(`/builder/${id}`);
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
  };
  
  const toggleDropdown = (id: string | null) => {
    setShowDropdown(id === showDropdown ? null : id);
  };
  
  const handleCardClick = async (id: string) => {
    try {
      await setCurrentWorkflow(id);
      navigate(`/builder/${id}`);
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
  };
  
  const filteredWorkflows = workflows.filter((workflow) =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
        Error loading workflows: {error}
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Workflows</h1>
          <p className="text-gray-500 mt-1">
            Create and manage your automation workflows
          </p>
        </div>
        
        <Button
          variant="primary"
          leftIcon={<PlusCircle size={16} />}
          onClick={() => setShowCreateModal(true)}
        >
          New Workflow
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="relative">
          <input
            type="text"
            className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {showCreateModal && (
        <CreateWorkflowModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateWorkflow}
        />
      )}
      
      {filteredWorkflows.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <PlusCircle size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No workflows found</h3>
          <p className="text-gray-500 mt-1 mb-4">
            {searchTerm 
              ? 'Try adjusting your search or create a new workflow'
              : 'Get started by creating your first workflow'}
          </p>
          <Button
            variant="primary"
            leftIcon={<PlusCircle size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Workflow
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <Card 
              key={workflow.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCardClick(workflow.id)}
            >
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-lg">{workflow.name}</h3>
                    <div className="relative">
                      <button
                        className="p-1.5 rounded-full hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(workflow.id);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {showDropdown === workflow.id && (
                        <div className="absolute right-0 z-10 mt-1 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                          <button 
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditWorkflow(workflow.id);
                            }}
                          >
                            <Edit size={14} className="mr-2" />
                            Edit
                          </button>
                          <button 
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Play size={14} className="mr-2" />
                            Run Workflow
                          </button>
                          <button 
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Copy size={14} className="mr-2" />
                            Duplicate
                          </button>
                          <button 
                            className="flex items-center px-4 py-2 text-sm text-error-600 hover:bg-error-50 w-full text-left"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkflow(workflow.id, workflow.name);
                            }}
                          >
                            <Trash2 size={14} className="mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-500 text-sm mt-1">
                    {workflow.description || 'No description provided'}
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-500">
                    <Calendar size={14} className="mr-1.5" />
                    <span>Created {formatDate(workflow.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      workflow.status === 'active' 
                        ? 'bg-success-100 text-success-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkflowList;