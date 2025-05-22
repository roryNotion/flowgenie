import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Clock, Zap, Activity, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';

// Sample data - In a real app, this would come from your analytics service
const timelineData = [
  { date: '2024-03-01', executions: 45, timeSaved: 120 },
  { date: '2024-03-02', executions: 52, timeSaved: 140 },
  { date: '2024-03-03', executions: 48, timeSaved: 130 },
  { date: '2024-03-04', executions: 70, timeSaved: 180 },
  { date: '2024-03-05', executions: 61, timeSaved: 160 },
  { date: '2024-03-06', executions: 65, timeSaved: 170 },
  { date: '2024-03-07', executions: 75, timeSaved: 200 },
];

const integrationUsage = [
  { name: 'Supabase', value: 40 },
  { name: 'OpenAI', value: 30 },
  { name: 'SendGrid', value: 20 },
  { name: 'Resend', value: 10 },
];

const COLORS = ['#4f46e5', '#0d9488', '#f59e0b', '#ef4444'];

const AnalyticsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Monitor your automation performance and impact
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Executions</p>
                <h3 className="text-2xl font-bold mt-1">416</h3>
                <p className="text-sm text-success-600 flex items-center mt-1">
                  <ArrowUp size={14} className="mr-1" />
                  12% vs last week
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <Zap size={24} className="text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Time Saved</p>
                <h3 className="text-2xl font-bold mt-1">1,100 hrs</h3>
                <p className="text-sm text-success-600 flex items-center mt-1">
                  <ArrowUp size={14} className="mr-1" />
                  8% vs last week
                </p>
              </div>
              <div className="p-3 bg-secondary-100 rounded-lg">
                <Clock size={24} className="text-secondary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Workflows</p>
                <h3 className="text-2xl font-bold mt-1">24</h3>
                <p className="text-sm text-error-600 flex items-center mt-1">
                  <ArrowDown size={14} className="mr-1" />
                  3% vs last week
                </p>
              </div>
              <div className="p-3 bg-warning-100 rounded-lg">
                <Activity size={24} className="text-warning-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <h3 className="text-2xl font-bold mt-1">156</h3>
                <p className="text-sm text-success-600 flex items-center mt-1">
                  <ArrowUp size={14} className="mr-1" />
                  24% vs last week
                </p>
              </div>
              <div className="p-3 bg-error-100 rounded-lg">
                <Users size={24} className="text-error-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Workflow Executions</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="executions" 
                    stroke="#4f46e5" 
                    fill="#4f46e5" 
                    fillOpacity={0.1} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Time Saved (Hours)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="timeSaved" fill="#0d9488" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Integration Usage</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={integrationUsage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {integrationUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Workflows</h3>
            <div className="space-y-4">
              {[
                { name: 'User Onboarding', executions: 156, success: 98 },
                { name: 'Data Sync', executions: 143, success: 95 },
                { name: 'Email Campaign', executions: 112, success: 99 },
                { name: 'Lead Processing', executions: 98, success: 92 },
                { name: 'Document Generation', executions: 87, success: 97 },
              ].map((workflow, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{workflow.name}</h4>
                    <p className="text-sm text-gray-500">
                      {workflow.executions} executions
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-success-600">
                      {workflow.success}% success
                    </div>
                    <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                      <div 
                        className="h-full bg-success-500 rounded-full"
                        style={{ width: `${workflow.success}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;