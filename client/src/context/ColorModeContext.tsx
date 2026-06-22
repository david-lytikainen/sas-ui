import { createContext } from 'react';

interface ColorModeContextType {
  toggleColorMode: () => void;
  mode: 'dark';
}

export const ColorModeContext = createContext<ColorModeContextType>({
  toggleColorMode: () => {},
  mode: 'dark',
});
