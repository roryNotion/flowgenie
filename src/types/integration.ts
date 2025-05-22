// Integration Definition Types
export interface IntegrationAuthField {
  key: string;
  label: string;
  type: 'text' | 'password';
  required: boolean;
}

export interface IntegrationAuth {
  type: 'apiKey';
  fields: IntegrationAuthField[];
}

export interface IntegrationTestConfig {
  method: 'GET' | 'POST';
  url: string;
  headers?: Record<string, string>;
}

export interface IntegrationActionField {
  key: string;
  type: 'string' | 'text' | 'json';
  required?: boolean;
  default?: string;
}

export interface IntegrationAction {
  id: string;
  label: string;
  description?: string;
  fields: IntegrationActionField[];
}

export interface IntegrationTrigger {
  id: string;
  label: string;
  description?: string;
}

export interface IntegrationDefinition {
  id: string;
  displayName: string;
  auth: IntegrationAuth;
  testConnection: IntegrationTestConfig;
  actions: IntegrationAction[];
  triggers: IntegrationTrigger[];
}

// User Integration Types
export interface UserIntegration {
  id: string;
  userId: string;
  definitionId: string; // References integration_definitions.id
  name: string;
  config: Record<string, any>;
  status: 'pending' | 'connected' | 'error';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  lastTested?: Date;
}

export interface IntegrationKey {
  id: string;
  integrationId: string;
  keyName: string;
  encryptedValue: string;
  createdAt: Date;
}