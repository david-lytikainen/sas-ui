import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SplashContextType {
  showLoginSplash: boolean;
  setShowLoginSplash: (show: boolean) => void;
  showLogoutSplash: boolean;
  setShowLogoutSplash: (show: boolean) => void;
}

const SplashContext = createContext<SplashContextType | undefined>(undefined);

export const SplashProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showLoginSplash, setShowLoginSplash] = useState(false);
  const [showLogoutSplash, setShowLogoutSplash] = useState(false);

  return (
    <SplashContext.Provider 
      value={{ 
        showLoginSplash, 
        setShowLoginSplash,
        showLogoutSplash,
        setShowLogoutSplash
      }}
    >
      {children}
    </SplashContext.Provider>
  );
};

export const useSplash = () => {
  const context = useContext(SplashContext);
  if (context === undefined) {
    throw new Error('useSplash must be used within a SplashProvider');
  }
  return context;
}; 