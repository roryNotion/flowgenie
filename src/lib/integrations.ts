import { supabase } from './supabase';
import { IntegrationDefinition, UserIntegration } from '../types/integration';

// Fetch all available integration definitions
export async function getIntegrationDefinitions(): Promise<IntegrationDefinition[]> {
  const { data, error } = await supabase
    .from('integration_definitions')
    .select('*');

  if (error) throw error;
  return data.map(row => ({
    ...row.definition,
    id: row.id,
    displayName: row.display_name,
  }));
}

// Get a specific integration definition
export async function getIntegrationDefinition(id: string): Promise<IntegrationDefinition> {
  const { data, error } = await supabase
    .from('integration_definitions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return {
    ...data.definition,
    id: data.id,
    displayName: data.display_name,
  };
}

// Test an integration connection
export async function testIntegrationConnection(
  definition: IntegrationDefinition,
  config: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Replace placeholders in URL and headers
    let url = definition.testConnection.url;
    let headers: Record<string, string> = {};

    // Process URL placeholders
    Object.entries(config).forEach(([key, value]) => {
      url = url.replace(`{{${key}}}`, value);
    });

    // Process header placeholders
    if (definition.testConnection.headers) {
      headers = Object.entries(definition.testConnection.headers).reduce((acc, [key, value]) => {
        let processedValue = value;
        Object.entries(config).forEach(([configKey, configValue]) => {
          processedValue = processedValue.replace(`{{${configKey}}}`, configValue);
        });
        return { ...acc, [key]: processedValue };
      }, {});
    }

    // Make the test request
    const response = await fetch(url, {
      method: definition.testConnection.method,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test connection',
    };
  }
}