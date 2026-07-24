import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnReconnect: "always",
      refetchOnWindowFocus: "always",
      staleTime: 15_000
    },
    mutations: {
      retry: 0
    }
  }
});

