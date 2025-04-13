import React, { useState } from 'react';
import useApi from '../hooks/useApi';

const ExampleDataView = () => {
  const [newItemName, setNewItemName] = useState('');
  const { 
    data: items, 
    loading, 
    error, 
    fetchData: refreshItems,
    createItem,
    updateItem,
    deleteItem
  } = useApi('items'); // Replace 'items' with your actual endpoint
  
  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    
    await createItem({ name: newItemName });
    setNewItemName('');
  };
  
  const handleUpdateItem = async (id, newName) => {
    await updateItem(id, { name: newName });
  };
  
  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteItem(id);
    }
  };
  
  if (loading && !items.length) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-display">Error: {error}</div>;
  
  return (
    <div className="data-container">
      <h2>Data from API</h2>
      
      <button onClick={refreshItems} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh Data'}
      </button>
      
      <form onSubmit={handleCreateItem}>
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="New item name"
        />
        <button type="submit" disabled={loading || !newItemName.trim()}>
          Add Item
        </button>
      </form>
      
      {items.length === 0 ? (
        <p>No items found</p>
      ) : (
        <ul className="items-list">
          {items.map(item => (
            <li key={item.id} className="item">
              <span>{item.name}</span>
              <div className="item-actions">
                <button 
                  onClick={() => {
                    const newName = prompt('Enter new name:', item.name);
                    if (newName && newName !== item.name) {
                      handleUpdateItem(item.id, newName);
                    }
                  }}
                >
                  Edit
                </button>
                <button onClick={() => handleDeleteItem(item.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExampleDataView; 