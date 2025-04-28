#!/bin/bash

# Set environment variables
export PORT=3000
export REACT_APP_API_URL=http://localhost:5001

# Start the React development server
echo "Starting frontend on port 3000, connecting to backend on port 5001..."
npm start 