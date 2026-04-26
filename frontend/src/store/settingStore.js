import { create } from 'zustand';
import api from '../services/api';

const useSettingStore = create((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/settings');
      set({ settings: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  updateSettings: async (settingsData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put('/settings', settingsData);
      set({ settings: response.data, loading: false });
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  uploadLogo: async (file) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update local state with new logo
      set(state => ({
        settings: { ...state.settings, logo_url: response.data.logo_url },
        loading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  downloadBackup: async () => {
    try {
      // Need to use native fetch for blobs easily
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/settings/backup', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Backup failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from header or generate one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'shopmanager_backup.dump';
      if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      return true;
    } catch (error) {
      set({ error: error.message });
      return false;
    }
  },

  restoreBackup: async (file) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/settings/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  factoryReset: async () => {
    set({ loading: true, error: null });
    try {
      await api.delete('/settings/factory-reset');
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  }
}));

export default useSettingStore;
