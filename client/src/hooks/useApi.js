import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

/**
 * Custom hook for API data fetching with loading and error states
 * @param {string} endpoint - API endpoint to fetch data from
 * @param {Object} options - Options for the hook
 * @returns {Object} - States and functions for API interaction
 */
const useApi = (endpoint, options = {}) => {
  const { initialData = [], autoFetch = true } = options;
  
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.fetchData(endpoint);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred fetching data');
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);
  
  const createItem = async (item) => {
    try {
      setLoading(true);
      const response = await apiService.postData(endpoint, item);
      setData(prevData => Array.isArray(prevData) ? [...prevData, response.data] : response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create item');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const updateItem = async (id, item) => {
    try {
      setLoading(true);
      const response = await apiService.updateData(endpoint, id, item);
      setData(prevData => {
        if (!Array.isArray(prevData)) return response.data;
        return prevData.map(d => d.id === id ? response.data : d);
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update item');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteItem = async (id) => {
    try {
      setLoading(true);
      await apiService.deleteData(endpoint, id);
      setData(prevData => {
        if (!Array.isArray(prevData)) return {};
        return prevData.filter(d => d.id !== id);
      });
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);
  
  return {
    data,
    loading,
    error,
    fetchData,
    createItem,
    updateItem,
    deleteItem,
    setData
  };
};

export default useApi; 