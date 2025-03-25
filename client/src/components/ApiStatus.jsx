import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const ApiStatus = () => {
  const [status, setStatus] = useState('checking');
  const useMockApi = localStorage.getItem('useMockApi') !== 'false';
  
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        if (useMockApi) {
          // Mock API is always "connected"
          setStatus('connected (mock)');
          return;
        }
        
        // Try to connect to the real API
        // Using a simple health check endpoint
        await apiService.get('/health');
        setStatus('connected');
      } catch (error) {
        console.error('API Health check failed:', error);
        setStatus(useMockApi ? 'connected (mock)' : 'disconnected');
      }
    };
    
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [useMockApi]);
  
  const statusColors = {
    checking: 'gray',
    'connected': 'green',
    'connected (mock)': 'blue',
    disconnected: 'red'
  };
  
  return (
    <div className="api-status" style={{ color: statusColors[status] }}>
      API Status: {status === 'checking' ? 'Checking...' : status}
    </div>
  );
};

export default ApiStatus; 