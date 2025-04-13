# SAS-UI (Saved and Single)

This is the frontend application for the SAS, a platform for organizing and managing speed dating events. It's built with React, TypeScript, and Material UI, communicating with the SAS-API backend.

## Project Structure

```
sas-ui/
├── client/               # Frontend React application
│   ├── public/           # Static assets
│   └── src/
│       ├── components/   # UI components
│       │   ├── admin/    # Admin-related components
│       │   ├── auth/     # Authentication components
│       │   ├── check-in/ # Event check-in components
│       │   ├── common/   # Shared/common components
│       │   ├── dashboard/# Dashboard components
│       │   ├── dates/    # Dating event components
│       │   ├── events/   # Event management components
│       │   ├── matches/  # Match results components
│       │   ├── notes/    # User notes components
│       │   ├── profile/  # User profile components
│       │   └── routing/  # Routing components
│       ├── context/      # React context providers
│       ├── data/         # Static data and fixtures
│       ├── hooks/        # Custom React hooks
│       ├── services/     # API services
│       ├── styles/       # Global styles
│       ├── types/        # TypeScript type definitions
│       └── utils/        # Utility functions
├── server/               # Legacy/deprecated server code
└── api/                  # Legacy/deprecated API code
```

## Features

- **User Authentication**: Sign up, sign in, and profile management
- **Event Management**: Create, view, and manage speed dating events
- **Admin Dashboard**: Admin-specific controls and views
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live updates for matches and notifications
- **Profile Customization**: User profile management
- **JWT Authentication**: Secure token-based authentication
- **Error Handling**: Comprehensive error handling and user feedback

## Technology Stack

- **React 18**: Frontend framework
- **TypeScript**: Type-safe JavaScript
- **Material UI**: Component library for consistent design
- **React Router**: For page navigation
- **Axios**: HTTP client for API requests
- **React Context API**: State management
- **JWT**: Token-based authentication
- **React Spring**: Animations
- **Framer Motion**: Enhanced animations and transitions

## Setup and Installation

### Prerequisites

- Node.js 16+ and npm
- SAS-API backend running on port 5001

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sas-ui.git
cd sas-ui
```

2. Install dependencies:
```bash
cd client
npm install
```

3. Configure the backend connection:
   - The project uses a proxy configuration in `package.json` to forward API requests to the backend
   - Ensure the `"proxy"` value is set to `"http://localhost:5001"` (or your backend URL)

## Running the Application

### Development Mode

Start the development server:
```bash
cd client
npm start
```

The React application will be available at `http://localhost:3000`.

### Production Build

To build the application for production:
```bash
cd client
npm run build
```

This will create a production-ready build in the `build` directory.

## Integration with Backend

This frontend communicates with the SAS-API Flask backend. The integration points include:

- **Authentication**: User registration and login
- **Event Management**: Creating and managing events
- **Profile Management**: Updating user profiles
- **Admin Functions**: User and event administration

## Using the Start Script

For convenience, we've created a start script that launches both the frontend and backend:

1. Ensure the start script is executable:
```bash
chmod +x /Users/jamiefitzgerald/PycharmProjects/start.sh
```

2. Run the script:
```bash
cd /Users/jamiefitzgerald/PycharmProjects
./start.sh
```

This script:
- Stops any running Flask server
- Starts the Flask backend on port 5001
- Starts the React frontend on port 3000
- Provides log file locations for troubleshooting

## Default Accounts

For testing, you can use these accounts:

- **Admin**:
  - Email: admin@example.com
  - Password: password

- **Attendee**:
  - Email: attendee@example.com
  - Password: password

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend CORS configuration allows requests from `http://localhost:3000`

2. **Authentication Errors**: If you get authentication errors:
   - Clear browser storage/cookies
   - Ensure the backend JWT configuration is correct
   - Check that you're using the correct credentials

3. **API Connection Issues**: If the frontend can't connect to the API:
   - Verify the backend is running on port 5001
   - Check the proxy setting in `package.json`
   - Look for any network errors in the browser console

### Log Files

When using the start script, logs are available at:
- Backend logs: `/tmp/flask.log`
- Frontend logs: `/tmp/react.log`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
