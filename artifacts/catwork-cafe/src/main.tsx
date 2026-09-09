import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import "./i18n";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Router base={base}>
      <App />
    </Router>
  </QueryClientProvider>
);
