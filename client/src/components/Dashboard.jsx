import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { currentUser } = useAuth();
  
  return (
    <div className="dashboard">
      <h1>Welcome to Your Dashboard</h1>
      
      <div className="user-profile-summary">
        <h2>Your Profile</h2>
        <div className="profile-details">
          <p><strong>Name:</strong> {currentUser.first_name} {currentUser.last_name}</p>
          <p><strong>Email:</strong> {currentUser.email}</p>
          {/* Display other user details as needed */}
        </div>
      </div>
      
      <div className="dashboard-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button onClick={() => console.log('View profile')}>
            View Full Profile
          </button>
          <button onClick={() => console.log('Edit profile')}>
            Edit Profile
          </button>
          {/* Add more action buttons as needed */}
        </div>
      </div>
      
      {/* Add more dashboard sections/widgets as needed */}
    </div>
  );
};

export default Dashboard; 