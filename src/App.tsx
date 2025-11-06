import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import ProjectDetail from "./pages/ProjectDetail";
import Projetos from "./pages/Projetos";
import Usuarios from "./pages/Usuarios";
import Configuracoes from "./pages/Configuracoes";
import Dashboard from "./pages/Dashboard";
import FinancialReport from "./pages/FinancialReport";
import ClientPortalTasks from "./pages/ClientPortalTasks";
import ClientPortalTaskDetail from "./pages/ClientPortalTaskDetail";
import NotFound from "./pages/NotFound";
import { AuthLayout } from "./components/AuthLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              
              <Route element={<AuthLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projetos" element={<Projetos />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/reports/financial" element={<FinancialReport />} />
                <Route path="/client-portal/tasks" element={<ClientPortalTasks />} />
                <Route path="/client-portal/tasks/:id" element={<ClientPortalTaskDetail />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
