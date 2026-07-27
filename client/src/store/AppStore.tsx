import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NavigationResult, SearchResult } from "@/types";

type Language = "en" | "am";

interface AppState {
  searchQuery: string;
  searchResults: SearchResult[];
  selectedResult: SearchResult | null;
  navigation: NavigationResult | null;
  isDarkMode: boolean;
  language: Language;
}

interface AppStoreValue extends AppState {
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setSelectedResult: (result: SearchResult | null) => void;
  setNavigation: (navigation: NavigationResult | null) => void;
  resetNavigationFlow: () => void;
  toggleDarkMode: () => void;
  setLanguage: (lang: Language) => void;
}

const initialState: AppState = {
  searchQuery: "",
  searchResults: [],
  selectedResult: null,
  navigation: null,
  isDarkMode: false,
  language: "en",
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  // Initialise dark mode from localStorage / system preference on mount
  useEffect(() => {
    const stored = localStorage.getItem("aastu-dark-mode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored !== null ? stored === "true" : prefersDark;
    setState((s) => ({ ...s, isDarkMode: dark }));
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const value = useMemo<AppStoreValue>(
    () => ({
      ...state,
      setSearchQuery: (searchQuery) =>
        setState((current) => ({ ...current, searchQuery })),
      setSearchResults: (searchResults) =>
        setState((current) => ({ ...current, searchResults })),
      setSelectedResult: (selectedResult) =>
        setState((current) => ({ ...current, selectedResult })),
      setNavigation: (navigation) =>
        setState((current) => ({ ...current, navigation })),
      resetNavigationFlow: () => setState(initialState),
      toggleDarkMode: () =>
        setState((current) => {
          const next = !current.isDarkMode;
          document.documentElement.classList.toggle("dark", next);
          localStorage.setItem("aastu-dark-mode", String(next));
          return { ...current, isDarkMode: next };
        }),
      setLanguage: (language) =>
        setState((current) => ({ ...current, language })),
    }),
    [state]
  );

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStoreValue {
  const context = useContext(AppStoreContext);

  if (!context) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }

  return context;
}
