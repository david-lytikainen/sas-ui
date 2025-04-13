import React, { useState, useEffect } from 'react';
import ApiStatus from './components/ApiStatus';
import ExampleDataView from './components/ExampleDataView';
import AuthPage from './components/AuthPage';
import { authApi } from './services/api';
// Import other components as needed

function App() {
  const [useMockApi, setUseMockApi] = useState(() => {
    // Get stored preference or default to true
    return localStorage.getItem('useMockApi') !== 'false';
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Store the preference whenever it changes
    localStorage.setItem('useMockApi', useMockApi.toString());
    
    // Reload the app when API mode changes to ensure all components update
    if (useMockApi !== (localStorage.getItem('useMockApi') !== 'false')) {
      window.location.reload();
    }
  }, [useMockApi]);
  
  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // If we have a token, assume we're authenticated
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    authApi.logout && authApi.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>SAS Application</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <label>
            <input 
              type="checkbox" 
              checked={useMockApi} 
              onChange={(e) => setUseMockApi(e.target.checked)}
            />
            Use Mock API
          </label>
          <ApiStatus />
          <button 
            onClick={handleLogout}
            style={{
              marginLeft: 'auto',
              padding: '8px 12px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>
      
      <main>
        <ExampleDataView />
        {/* Add your other components here */}
      </main>
    </div>
  );
}

export default App; 