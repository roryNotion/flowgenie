import React from 'react';
import { PlusCircle, Database, GitBranch, Brain, Send, Mail } from 'lucide-react';
import { NodeType } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

const NodePanel: React.FC = () => {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };
  
  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader className="sticky top-0 bg-white z-10 border-b">
        <CardTitle className="text-lg flex items-center">
          <PlusCircle size={16} className="mr-2" />
          Add Nodes
        </CardTitle>
      </CardHeader>
      <CardContent className="py-4">
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500">Triggers</h3>
            <div 
              className="flex items-center gap-2 p-3 rounded-md border border-gray-200 bg-white hover:bg-gray-50 cursor-grab transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, 'trigger')}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-error-100 text-error-600 flex items-center justify-center">
                <Database size={15} />
              </div>
              <div>
                <h4 className="font-medium text-sm">Supabase Trigger</h4>
                <p className="text-xs text-gray-500">When a database row changes</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500">Logic</h3>
            <div 
              className="flex items-center gap-2 p-3 rounded-md border border-gray-200 bg-white hover:bg-gray-50 cursor-grab transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, 'condition')}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-warning-100 text-warning-600 flex items-center justify-center">
                <GitBranch size={15} />
              </div>
              <div>
                <h4 className="font-medium text-sm">Condition</h4>
                <p className="text-xs text-gray-500">Branch based on data</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500">AI</h3>
            <div 
              className="flex items-center gap-2 p-3 rounded-md border border-gray-200 bg-white hover:bg-gray-50 cursor-grab transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, 'aiblock')}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                <Brain size={15} />
              </div>
              <div>
                <h4 className="font-medium text-sm">OpenAI</h4>
                <p className="text-xs text-gray-500">Process data with AI</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500">Actions</h3>
            <div 
              className="flex items-center gap-2 p-3 rounded-md border border-gray-200 bg-white hover:bg-gray-50 cursor-grab transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, 'action')}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center">
                <Mail size={15} />
              </div>
              <div>
                <h4 className="font-medium text-sm">Send Email</h4>
                <p className="text-xs text-gray-500">Send an email via SendGrid/Resend</p>
              </div>
            </div>
            
            <div 
              className="flex items-center gap-2 p-3 rounded-md border border-gray-200 bg-white hover:bg-gray-50 cursor-grab transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, 'action')}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center">
                <Database size={15} />
              </div>
              <div>
                <h4 className="font-medium text-sm">Update Database</h4>
                <p className="text-xs text-gray-500">Write to Supabase database</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NodePanel;