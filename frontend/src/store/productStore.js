import { create } from 'zustand';
import api from '../services/api';

const useProductStore = create((set, get) => ({
  products: [],
  categories: [],
  brands: [],
  loading: false,
  error: null,

  fetchProducts: async (search = '') => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/products', { params: { search } });
      set({ products: response.data, loading: false });
    } catch (error) {
      const detail = error.response?.data?.detail;
      const errorMsg = Array.isArray(detail) 
        ? detail.map(err => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join(', ')
        : detail || 'Failed to fetch products';
      set({ error: errorMsg, loading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const response = await api.get('/categories');
      set({ categories: response.data });
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  },

  fetchBrands: async () => {
    try {
      const response = await api.get('/brands');
      set({ brands: response.data });
    } catch (error) {
      console.error('Failed to fetch brands', error);
    }
  },

  addProduct: async (productData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/products', productData);
      await get().fetchProducts();
      return response.data; // Return the created product
    } catch (error) {
      const detail = error.response?.data?.detail;
      const errorMsg = Array.isArray(detail) 
        ? detail.map(err => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join(', ')
        : detail || 'Failed to add product';
      set({ error: errorMsg, loading: false });
      return null;
    }
  },

  updateProduct: async (id, productData) => {
    set({ loading: true, error: null });
    try {
      await api.put(`/products/${id}`, productData);
      await get().fetchProducts();
      return true;
    } catch (error) {
      set({ error: error.response?.data?.detail || 'Failed to update product', loading: false });
      return false;
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/products/${id}`);
      await get().fetchProducts();
      return true;
    } catch (error) {
      set({ error: error.response?.data?.detail || 'Failed to delete product', loading: false });
      return false;
    }
  },

  uploadImage: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/products/${id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await get().fetchProducts();
      return true;
    } catch (error) {
      console.error('Failed to upload image', error);
      return false;
    }
  },

  addCategory: async (name) => {
    try {
      await api.post('/categories', { name });
      await get().fetchCategories();
      return true;
    } catch (error) {
      console.error('Failed to add category', error);
      return false;
    }
  },

  addBrand: async (name) => {
    try {
      await api.post('/brands', { name });
      await get().fetchBrands();
      return true;
    } catch (error) {
      console.error('Failed to add brand', error);
      return false;
    }
  },
}));

export default useProductStore;
