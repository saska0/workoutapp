import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnalyticsPeriod, AnalyticsResponse, fetchAnalytics } from '../api/analytics';

const CACHE_TTL_MS = 5000 * 60; // 5 minutes

interface CacheEntry {
  data?: AnalyticsResponse;
  lastUpdated?: number;
  loading: boolean;
  error: string | null;
}

type CacheState = Record<AnalyticsPeriod, CacheEntry>;

interface AnalyticsContextValue {
  getCachedData: (period: AnalyticsPeriod) => CacheEntry;
  ensureDataLoaded: (period: AnalyticsPeriod, options?: { forceRefresh?: boolean }) => Promise<void>;
  refreshData: (period: AnalyticsPeriod) => Promise<void>;
  invalidateCache: (period?: AnalyticsPeriod) => void;
}

const createEmptyCacheEntry = (): CacheEntry => ({
  loading: false,
  error: null,
});

const createInitialState = (): CacheState => ({
  '7d': createEmptyCacheEntry(),
  '30d': createEmptyCacheEntry(),
  all: createEmptyCacheEntry(),
});

const isCacheStale = (lastUpdated?: number): boolean => {
  if (!lastUpdated) return true;
  return Date.now() - lastUpdated > CACHE_TTL_MS;
};

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cacheState, setCacheState] = useState<CacheState>(createInitialState);
  const pendingRequests = useRef<Partial<Record<AnalyticsPeriod, Promise<void>>>>({});

  const ensureDataLoaded = useCallback(async (
    period: AnalyticsPeriod, 
    options?: { forceRefresh?: boolean }
  ) => {
    const cacheEntry = cacheState[period];
    const shouldSkipFetch = !options?.forceRefresh && 
                           !isCacheStale(cacheEntry.lastUpdated) && 
                           cacheEntry.data && 
                           !cacheEntry.error;
    
    if (shouldSkipFetch) return;
    
    if (pendingRequests.current[period]) {
      return pendingRequests.current[period]!;
    }

    const fetchPromise = async () => {
      setCacheState((prevState: CacheState) => ({
        ...prevState,
        [period]: { ...prevState[period], loading: true, error: null }
      }));

      try {
        const data = await fetchAnalytics(period);
        setCacheState((prevState: CacheState) => ({
          ...prevState,
          [period]: { 
            data, 
            lastUpdated: Date.now(), 
            loading: false, 
            error: null 
          }
        }));
      } catch (error: any) {
        const errorMessage = error?.message ?? 'Failed to fetch analytics';
        setCacheState((prevState: CacheState) => ({
          ...prevState,
          [period]: { 
            ...prevState[period], 
            loading: false, 
            error: errorMessage 
          }
        }));
      } finally {
        pendingRequests.current[period] = undefined;
      }
    };

    pendingRequests.current[period] = fetchPromise();
    await pendingRequests.current[period];
  }, [cacheState]);

  const refreshData = useCallback(
    (period: AnalyticsPeriod) => ensureDataLoaded(period, { forceRefresh: true }), 
    [ensureDataLoaded]
  );

  const invalidateCache = useCallback((period?: AnalyticsPeriod) => {
    setCacheState((prevState: CacheState) => {
      if (period) {
        return { 
          ...prevState, 
          [period]: { ...prevState[period], lastUpdated: 0 } 
        };
      }
      
      // Invalidate all periods
      return {
        '7d': { ...prevState['7d'], lastUpdated: 0 },
        '30d': { ...prevState['30d'], lastUpdated: 0 },
        all: { ...prevState.all, lastUpdated: 0 },
      };
    });
  }, []);

  // Register global cache invalidation when provider mounts
  React.useEffect(() => {
    globalInvalidateCache = () => invalidateCache();
    return () => { globalInvalidateCache = null; };
  }, [invalidateCache]);

  const getCachedData = useCallback(
    (period: AnalyticsPeriod) => cacheState[period], 
    [cacheState]
  );

  const contextValue: AnalyticsContextValue = {
    getCachedData,
    ensureDataLoaded,
    refreshData,
    invalidateCache,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Global registry for cache invalidation (used by API layer)
let globalInvalidateCache: (() => void) | null = null;

export const invalidateAnalyticsCache = () => {
  if (globalInvalidateCache) {
    globalInvalidateCache();
  }
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  
  return context;
};