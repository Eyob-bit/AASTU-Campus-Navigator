import React, { createContext, useContext } from "react";
import { useAppStore } from "@/store";

interface ThemeContextType {
  isDark: boolean;
  setTheme: (dark: boolean) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode, toggleDarkMode } = useAppStore();

  const setTheme = (dark: boolean) => {
    if (isDarkMode !== dark) {
      toggleDarkMode();
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        isDark: isDarkMode,
        setTheme,
        toggleTheme: toggleDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback gracefully to useAppStore if outside ThemeProvider
    const { isDarkMode, toggleDarkMode } = useAppStore();
    return {
      isDark: isDarkMode,
      setTheme: (dark: boolean) => {
        if (isDarkMode !== dark) toggleDarkMode();
      },
      toggleTheme: toggleDarkMode,
    };
  }
  return context;
}
