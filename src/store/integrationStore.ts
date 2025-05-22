import { create } from 'zustand';
import { toast } from 'sonner';
import { Integration, IntegrationType } from '../types';
import { INTEGRATION_REGISTRY } from '../lib/integrationRegistry';
import { supabase } from '../lib/supabase';

interface IntegrationState {
  integrations: Integration[];
  loading: boolean;
  error: string | null;
  
  // Integration Actions
  fetchIntegrations: () => Promise<void>;
  createIntegration: (type: IntegrationType, name: string, config: Record<string, any>, keys?: Record<string, string>) => Promise<Integration>;
  updateIntegration: (id: string, data: Partial<Integration>) => Promise<Integration>;
  deleteIntegration: (id: string) => Promise<void>;
  getIntegrationById: (id: string) => Integration | undefined;
  getIntegrationsByType: (type: IntegrationType) => Integration[];
  testIntegration: (id: string) => Promise<any>;
}

export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  integrations: [],
  loading: false,
  error: null,
  
  fetchIntegrations: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*, integration_keys(*)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      set({ integrations: data || [], loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch integrations',
        loading: false 
      });
    }
  },
  
  createIntegration: async (type, name, config, keys) => {
    set({ loading: true, error: null });
    try {
      // First test the integration
      const testResult = await INTEGRATION_REGISTRY[type].test({
        ...config,
        ...keys,
      });
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const newIntegration = {
        user_id: user.user.id,
        type,
        name,
        config,
        status: testResult.success ? 'connected' : 'error',
        error: testResult.error,
      };
      
      // Insert the integration
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .insert([newIntegration])
        .select()
        .single();
        
      if (integrationError) throw integrationError;
      
      // If we have keys, store them securely
      if (keys && Object.keys(keys).length > 0) {
        const keyEntries = Object.entries(keys).map(([key_name, value]) => ({
          integration_id: integration.id,
          key_name,
          encrypted_value: value,
        }));
        
        const { error: keysError } = await supabase
          .from('integration_keys')
          .insert(keyEntries);
          
        if (keysError) throw keysError;
      }
      
      set((state) => ({
        integrations: [integration, ...state.integrations],
        loading: false,
      }));
      
      toast.success('Integration created successfully');
      return integration;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create integration';
      set({ error: errorMessage, loading: false });
      toast.error(`Failed to create integration: ${errorMessage}`);
      throw error;
    }
  },
  
  updateIntegration: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const { data: updatedIntegration, error } = await supabase
        .from('integrations')
        .update(data)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      set((state) => ({
        integrations: state.integrations.map((i) => 
          i.id === id ? updatedIntegration : i
        ),
        loading: false,
      }));
      
      toast.success('Integration updated successfully');
      return updatedIntegration;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update integration';
      set({ error: errorMessage, loading: false });
      toast.error(`Failed to update integration: ${errorMessage}`);
      throw error;
    }
  },
  
  deleteIntegration: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      set((state) => ({
        integrations: state.integrations.filter((i) => i.id !== id),
        loading: false,
      }));
      
      toast.success('Integration deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete integration';
      set({ error: errorMessage, loading: false });
      toast.error(`Failed to delete integration: ${errorMessage}`);
      throw error;
    }
  },
  
  getIntegrationById: (id) => {
    return get().integrations.find((i) => i.id === id);
  },
  
  getIntegrationsByType: (type) => {
    return get().integrations.filter((i) => i.type === type);
  },
  
  testIntegration: async (id) => {
    set({ loading: true, error: null });
    try {
      const integration = get().getIntegrationById(id);
      if (!integration) throw new Error('Integration not found');
      
      const testResult = await INTEGRATION_REGISTRY[integration.type].test({
        ...integration.config,
      });
      
      // Update integration status
      await get().updateIntegration(id, {
        status: testResult.success ? 'connected' : 'error',
        error: testResult.error,
      });
      
      set({ loading: false });
      
      if (testResult.success) {
        toast.success('Integration test successful');
      } else {
        toast.error(`Integration test failed: ${testResult.error}`);
      }
      
      return testResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to test integration';
      set({ error: errorMessage, loading: false });
      toast.error(`Failed to test integration: ${errorMessage}`);
      throw error;
    }
  },
}));