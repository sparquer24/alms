import { QueryClient } from '@tanstack/react-query';

// Module-level singleton, shared by RootProviders (for QueryClientProvider)
// and anywhere outside React that needs to interact with the cache directly
// (e.g. the logout thunk clearing all cached data for the previous session).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
    },
    mutations: {
      // Never silently retry a POST/PUT/DELETE — a retried mutation can
      // duplicate a side effect (e.g. double-create a record) if the first
      // attempt actually succeeded server-side but the response was lost.
      retry: 0,
    },
  },
});

export default queryClient;
