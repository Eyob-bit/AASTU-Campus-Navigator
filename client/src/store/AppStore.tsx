import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  const stateRef = useRef(state);
  stateRef.current = state;

  // Initialise dark mode from localStorage / system preference on mount
  useEffect(() => {
    const stored = localStorage.getItem("aastu-dark-mode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored !== null ? stored === "true" : prefersDark;
    setState((s) => ({ ...s, isDarkMode: dark }));
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  // Stable setter functions using useCallback - these never change identity
  const setSearchQuery = useCallback(
    (searchQuery: string) => setState((current) => ({ ...current, searchQuery })),
    []
  );
  const setSearchResults = useCallback(
    (searchResults: SearchResult[]) => setState((current) => ({ ...current, searchResults })),
    []
  );
  const setSelectedResult = useCallback(
    (selectedResult: SearchResult | null) => setState((current) => ({ ...current, selectedResult })),
    []
  );
  const setNavigation = useCallback(
    (navigation: NavigationResult | null) => setState((current) => ({ ...current, navigation })),
    []
  );
  const resetNavigationFlow = useCallback(
    () =>
      setState((current) => ({
        ...current,
        navStep: "IDLE",
        destinationTarget: null,
        navigation: null,
        selectedResult: null,
        currentStepIndex: 0,
        currentInstructionIndex: 0,
      })),
    []
  );
  const toggleDarkMode = useCallback(() => {
    setState((current) => {
      const next = !current.isDarkMode;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("aastu-dark-mode", String(next));
      return { ...current, isDarkMode: next };
    });
  }, []);
  const setLanguage = useCallback(
    (language: Language) => setState((current) => ({ ...current, language })),
    []
  );
  const setNavStep = useCallback(
    (navStep: NavStep) => setState((current) => ({ ...current, navStep })),
    []
  );
  const setDestinationTarget = useCallback(
    (destinationTarget: DestinationTarget | null) => setState((current) => ({ ...current, destinationTarget })),
    []
  );
  const setUserLocation = useCallback(
    (userLocation: { lat: number; lng: number } | null) => setState((current) => ({ ...current, userLocation })),
    []
  );
  const setCurrentStepIndex = useCallback(
    (currentStepIndex: number) => setState((current) => ({ ...current, currentStepIndex })),
    []
  );
  const setActiveRoute = useCallback(
    (activeRoute: RouteResponse | null) => setState((current) => ({ ...current, activeRoute })),
    []
  );
  const setCurrentInstructionIndex = useCallback(
    (currentInstructionIndex: number) => setState((current) => ({ ...current, currentInstructionIndex })),
    []
  );
  const startOutdoorNavigation = useCallback(
    (target: DestinationTarget) =>
      setState((current) => ({
        ...current,
        destinationTarget: target,
        navStep: "OUTDOOR_NAV",
        currentStepIndex: 0,
        currentInstructionIndex: 0,
        activeRoute: null,
      })),
    []
  );
  const triggerArrival = useCallback(
    () => setState((current) => ({ ...current, navStep: "ARRIVAL_BOTSHEET" })),
    []
  );
  const enterBuilding = useCallback(
    () => setState((current) => ({ ...current, navStep: "BUILDING_TRANSITION" })),
    []
  );
  const startIndoorNavigation = useCallback(
    () =>
      setState((current) => ({
        ...current,
        navStep: "INDOOR_PANORAMA",
        currentStepIndex: 0,
      })),
    []
  );
  const finishNavigation = useCallback(
    () =>
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
    []
  );

  const value = useMemo<AppStoreValue>(
    () => ({
      ...state,
      setSearchQuery,
      setSearchResults,
      setSelectedResult,
      setNavigation,
      resetNavigationFlow,
      toggleDarkMode,
      setLanguage,
      setNavStep,
      setDestinationTarget,
      setUserLocation,
      setCurrentStepIndex,
      setActiveRoute,
      setCurrentInstructionIndex,
      startOutdoorNavigation,
      triggerArrival,
      enterBuilding,
      startIndoorNavigation,
      finishNavigation,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, setSearchQuery, setSearchResults, setSelectedResult, setNavigation, resetNavigationFlow, toggleDarkMode, setLanguage, setNavStep, setDestinationTarget, setUserLocation, setCurrentStepIndex, setActiveRoute, setCurrentInstructionIndex, startOutdoorNavigation, triggerArrival, enterBuilding, startIndoorNavigation, finishNavigation]
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
