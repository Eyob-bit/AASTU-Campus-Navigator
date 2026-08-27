import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
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

interface AppActions {
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setSelectedResult: (result: SearchResult | null) => void;
  setNavigation: (navigation: NavigationResult | null) => void;
  resetNavigationFlow: () => void;
  toggleDarkMode: () => void;
  /** Applies a dark-mode value without persisting it (used for first-load detection). */
  setDarkMode: (dark: boolean) => void;
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

type AppStoreValue = AppState & AppActions;

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

interface Store {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => AppStoreValue;
  actions: AppActions;
}

/**
 * Builds an external store rather than holding state in `useState`.
 *
 * The previous implementation kept one monolithic state object in Context, so any
 * change — including a 2Hz GPS position update — produced a new context value and
 * re-rendered every consumer, navigation-related or not. Here consumers subscribe
 * and can select just the slice they care about.
 */
function createStore(): Store {
  let state: AppState = initialState;
  let snapshot: AppStoreValue;
  const listeners = new Set<() => void>();

  function setState(updater: (current: AppState) => AppState): void {
    const next = updater(state);
    // Reference equality means the action decided nothing changed — skip the notify.
    if (next === state) return;
    state = next;
    snapshot = { ...state, ...actions };
    for (const listener of listeners) listener();
  }

  const actions: AppActions = {
    setSearchQuery: (searchQuery) => setState((current) => ({ ...current, searchQuery })),
    setSearchResults: (searchResults) => setState((current) => ({ ...current, searchResults })),
    setSelectedResult: (selectedResult) => setState((current) => ({ ...current, selectedResult })),
    setNavigation: (navigation) => setState((current) => ({ ...current, navigation })),

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

    setLanguage: (language) => setState((current) => ({ ...current, language })),

    setDarkMode: (isDarkMode) =>
      setState((current) => (current.isDarkMode === isDarkMode ? current : { ...current, isDarkMode })),

    setNavStep: (navStep) =>
      setState((current) => (current.navStep === navStep ? current : { ...current, navStep })),

    setDestinationTarget: (destinationTarget) =>
      setState((current) => ({ ...current, destinationTarget })),

    /**
     * Keeps the previous object when the coordinates are unchanged. Downstream route
     * geometry is memoised on this reference, so allocating a fresh `{lat,lng}` for an
     * identical fix would needlessly invalidate the polyline every tick.
     */
    setUserLocation: (userLocation) =>
      setState((current) => {
        const prev = current.userLocation;
        if (prev === userLocation) return current;
        if (prev == null && userLocation == null) return current;
        if (
          prev != null &&
          userLocation != null &&
          prev.lat === userLocation.lat &&
          prev.lng === userLocation.lng
        ) {
          return current;
        }
        return { ...current, userLocation };
      }),

    setCurrentStepIndex: (currentStepIndex) =>
      setState((current) =>
        current.currentStepIndex === currentStepIndex
          ? current
          : { ...current, currentStepIndex }
      ),

    setActiveRoute: (activeRoute) => setState((current) => ({ ...current, activeRoute })),

    setCurrentInstructionIndex: (currentInstructionIndex) =>
      setState((current) =>
        current.currentInstructionIndex === currentInstructionIndex
          ? current
          : { ...current, currentInstructionIndex }
      ),

    startOutdoorNavigation: (target) =>
      setState((current) => ({
        ...current,
        destinationTarget: target,
        navStep: "OUTDOOR_NAV",
        currentStepIndex: 0,
        currentInstructionIndex: 0,
        activeRoute: null,
      })),

    triggerArrival: () =>
      setState((current) =>
        current.navStep === "ARRIVAL_BOTSHEET"
          ? current
          : { ...current, navStep: "ARRIVAL_BOTSHEET" }
      ),

    enterBuilding: () => setState((current) => ({ ...current, navStep: "BUILDING_TRANSITION" })),

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
  };

  snapshot = { ...state, ...actions };

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    actions,
  };
}

const AppStoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<Store | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createStore();
  }
  const store = storeRef.current;

  // Initialise dark mode from localStorage / system preference on mount
  useEffect(() => {
    const stored = localStorage.getItem("aastu-dark-mode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored !== null ? stored === "true" : prefersDark;
    document.documentElement.classList.toggle("dark", dark);
    store.actions.setDarkMode(dark);
  }, [store]);

  return <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>;
}

function useStore(): Store {
  const store = useContext(AppStoreContext);
  if (!store) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }
  return store;
}

/**
 * Subscribe to the app store.
 *
 * Called with no argument it returns the whole store and re-renders on any change.
 * Pass a selector to re-render only when that slice changes:
 *
 *   const navStep = useAppStore((s) => s.navStep);
 *
 * The selector must return a stable reference for unchanged data — selecting an
 * existing field or action is fine, building a new object inline is not.
 */
export function useAppStore(): AppStoreValue;
export function useAppStore<T>(selector: (store: AppStoreValue) => T): T;
export function useAppStore<T>(selector?: (store: AppStoreValue) => T): AppStoreValue | T {
  const store = useStore();

  const getSnapshot = useMemo<() => AppStoreValue | T>(
    () => (selector ? () => selector(store.getSnapshot()) : store.getSnapshot),
    [store, selector]
  );

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

/** Actions only — stable for the lifetime of the provider, so this never re-renders. */
export function useAppActions(): AppActions {
  return useStore().actions;
}

export type { AppState, AppActions, AppStoreValue };
