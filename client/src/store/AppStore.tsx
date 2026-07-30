import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  NavigationResult,
  SearchResult,
  NavStep,
  DestinationTarget,
} from "@/types";
import type { RouteResponse } from "@/api/roadNetwork.api";

type Language = "en" | "am";

interface AppState {
  searchQuery: string;
  searchResults: SearchResult[];
  selectedResult: SearchResult | null;
  navigation: NavigationResult | null;
  isDarkMode: boolean;
  language: Language;

  // Navigation State Machine
  navStep: NavStep;
  destinationTarget: DestinationTarget | null;
  userLocation: { lat: number; lng: number } | null;
  currentStepIndex: number;

  // Computed outdoor route from A* API
  activeRoute: RouteResponse | null;
  currentInstructionIndex: number;
}

interface AppStoreValue extends AppState {
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setSelectedResult: (result: SearchResult | null) => void;
  setNavigation: (navigation: NavigationResult | null) => void;
  resetNavigationFlow: () => void;
  toggleDarkMode: () => void;
  setLanguage: (lang: Language) => void;

  // Navigation Actions
  setNavStep: (step: NavStep) => void;
  setDestinationTarget: (target: DestinationTarget | null) => void;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  setCurrentStepIndex: (idx: number) => void;
  setActiveRoute: (route: RouteResponse | null) => void;
  setCurrentInstructionIndex: (idx: number) => void;
  startOutdoorNavigation: (target: DestinationTarget) => void;
  triggerArrival: () => void;
  enterBuilding: () => void;
  startIndoorNavigation: () => void;
  finishNavigation: () => void;
}

const initialState: AppState = {
  searchQuery: "",
  searchResults: [],
  selectedResult: null,
  navigation: null,
  isDarkMode: false,
  language: "en",

  navStep: "IDLE",
  destinationTarget: null,
  userLocation: null,
  currentStepIndex: 0,
  activeRoute: null,
  currentInstructionIndex: 0,
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
      resetNavigationFlow: () =>
        setState((current) => ({
          ...current,
          navStep: "IDLE",
          destinationTarget: null,
          navigation: null,
          selectedResult: null,
          currentStepIndex: 0,
          currentInstructionIndex: 0,
        })),
      toggleDarkMode: () =>
        setState((current) => {
          const next = !current.isDarkMode;
          document.documentElement.classList.toggle("dark", next);
          localStorage.setItem("aastu-dark-mode", String(next));
          return { ...current, isDarkMode: next };
        }),
      setLanguage: (language) =>
        setState((current) => ({ ...current, language })),

      setNavStep: (navStep) =>
        setState((current) => ({ ...current, navStep })),
      setDestinationTarget: (destinationTarget) =>
        setState((current) => ({ ...current, destinationTarget })),
      setUserLocation: (userLocation) =>
        setState((current) => ({ ...current, userLocation })),
      setCurrentStepIndex: (currentStepIndex) =>
        setState((current) => ({ ...current, currentStepIndex })),
      setActiveRoute: (activeRoute) =>
        setState((current) => ({ ...current, activeRoute })),
      setCurrentInstructionIndex: (currentInstructionIndex) =>
        setState((current) => ({ ...current, currentInstructionIndex })),

      startOutdoorNavigation: (target) =>
        setState((current) => ({
          ...current,
          destinationTarget: target,
          navStep: "OUTDOOR_NAV",
          currentStepIndex: 0,
          currentInstructionIndex: 0,
          activeRoute: null, // cleared; will be fetched fresh
        })),

      triggerArrival: () =>
        setState((current) => ({
          ...current,
          navStep: "ARRIVAL_BOTSHEET",
        })),

      enterBuilding: () =>
        setState((current) => ({
          ...current,
          navStep: "BUILDING_TRANSITION",
        })),

      startIndoorNavigation: () =>
        setState((current) => ({
          ...current,
          navStep: "INDOOR_PANORAMA",
          currentStepIndex: 0,
        })),

      finishNavigation: () =>
        setState((current) => ({
          ...current,
          navStep: "IDLE",
          destinationTarget: null,
          navigation: null,
          selectedResult: null,
          currentStepIndex: 0,
          currentInstructionIndex: 0,
          activeRoute: null,
        })),
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
