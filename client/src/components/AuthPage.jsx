import React, { useState } from 'react';
import { LoginForm, RegisterForm } from './AuthForms';

const AuthPage = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login');

  const handleLoginSuccess = (result) => {
    console.log('Login successful:', result);
    if (onLoginSuccess) {
      onLoginSuccess(result);
    }
  };

  const handleRegisterSuccess = (result) => {
    console.log('Registration successful:', result);
    if (onLoginSuccess) {
      onLoginSuccess(result);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-tabs">
          <button 
            className={`tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Sign In
          </button>
          <button 
            className={`tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Sign Up
          </button>
        </div>
        
        <div className="auth-content">
          {activeTab === 'login' ? (
            <LoginForm onSuccess={handleLoginSuccess} />
          ) : (
            <RegisterForm onSuccess={handleRegisterSuccess} />
          )}
        </div>
      </div>
      
      <style jsx>{`
        .auth-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          background-color: #f5f5f5;
        }
        
        .auth-container {
          width: 100%;
          max-width: 500px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .auth-tabs {
          display: flex;
          border-bottom: 1px solid #eee;
        }
        
        .tab {
          flex: 1;
          padding: 15px;
          background: none;
          border: none;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .tab.active {
          color: #4a90e2;
          border-bottom: 2px solid #4a90e2;
        }
        
        .auth-content {
          padding: 20px;
        }
        
        .auth-form h2 {
          margin-top: 0;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        
        button[type="submit"] {
          width: 100%;
          padding: 12px;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
          margin-top: 10px;
        }
        
        button[type="submit"]:hover {
          background-color: #3a80d2;
        }
        
        button[type="submit"]:disabled {
          background-color: #a5c6ef;
          cursor: not-allowed;
        }
        
        .error-message {
          color: #e74c3c;
          padding: 10px;
          background-color: #fdeaea;
          border-radius: 4px;
          margin-bottom: 15px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default AuthPage; 