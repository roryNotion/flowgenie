import { supabase } from './supabase';
import { Workflow, Integration, IntegrationType } from '../types';

// Workflows
export const getWorkflows = async () => {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getWorkflowById = async (id: string) => {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createWorkflow = async (workflow: Partial<Workflow>) => {
  const { data, error } = await supabase
    .from('workflows')
    .insert([workflow])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateWorkflow = async (id: string, workflow: Partial<Workflow>) => {
  const { data, error } = await supabase
    .from('workflows')
    .update(workflow)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteWorkflow = async (id: string) => {
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Integrations
export const getIntegrations = async () => {
  const { data, error } = await supabase
    .from('integrations')
    .select('*, integration_keys(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getIntegrationById = async (id: string) => {
  const { data, error } = await supabase
    .from('integrations')
    .select('*, integration_keys(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createIntegration = async (
  type: IntegrationType,
  name: string,
  config: Record<string, any>,
  keys?: Record<string, string>
) => {
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .insert([{ type, name, config }])
    .select()
    .single();

  if (integrationError) throw integrationError;

  // If we have keys, store them securely
  if (keys && Object.keys(keys).length > 0) {
    const keyEntries = Object.entries(keys).map(([key_name, value]) => ({
      integration_id: integration.id,
      key_name,
      encrypted_value: value, // In production, this would be encrypted
    }));

    const { error: keysError } = await supabase
      .from('integration_keys')
      .insert(keyEntries);

    if (keysError) throw keysError;
  }

  return integration;
};

export const updateIntegration = async (
  id: string,
  data: Partial<Integration>,
  keys?: Record<string, string>
) => {
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (integrationError) throw integrationError;

  // Update keys if provided
  if (keys && Object.keys(keys).length > 0) {
    // Delete existing keys
    await supabase
      .from('integration_keys')
      .delete()
      .eq('integration_id', id);

    // Insert new keys
    const keyEntries = Object.entries(keys).map(([key_name, value]) => ({
      integration_id: id,
      key_name,
      encrypted_value: value, // In production, this would be encrypted
    }));

    const { error: keysError } = await supabase
      .from('integration_keys')
      .insert(keyEntries);

    if (keysError) throw keysError;
  }

  return integration;
};

export const deleteIntegration = async (id: string) => {
  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('id', id);

  if (error) throw error;
};