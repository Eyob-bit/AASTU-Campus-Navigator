import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NavigationResult, SearchResult } from "@/types";

interface AppState {
  searchQuery: string;
  searchResults: SearchResult[];
  selectedResult: SearchResult | null;
  navigation: NavigationResult | null;
}

interface AppStoreValue extends AppState {
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setSelectedResult: (result: SearchResult | null) => void;
  setNavigation: (navigation: NavigationResult | null) => void;
  resetNavigationFlow: () => void;
}

const initialState: AppState = {
  searchQuery: "",
  searchResults: [],
  selectedResult: null,
  navigation: null,
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

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
    }),
    [state]
  );

  return (
    <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStoreValue {
  const context = useContext(AppStoreContext);

  if (!context) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }

  return context;
}
