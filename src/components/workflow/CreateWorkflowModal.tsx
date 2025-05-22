import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';

interface CreateWorkflowModalProps {
  onClose: () => void;
  onSubmit: (name: string, description?: string) => void;
}

const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name, description);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader className="bg-white border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Create New Workflow</CardTitle>
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
          
          <CardContent className="py-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workflow Name
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Workflow"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this workflow does..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="bg-gray-50 border-t">
            <div className="w-full flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                disabled={!name.trim()}
              >
                Create Workflow
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CreateWorkflowModal;