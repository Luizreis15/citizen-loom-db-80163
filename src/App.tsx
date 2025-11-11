import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import FirstAccess from "./pages/FirstAccess";
import FirstAccessCollaborator from "./pages/FirstAccessCollaborator";
import Sobre from "./pages/Sobre";
import Servicos from "./pages/Servicos";
import Fundadora from "./pages/Fundadora";
import Contato from "./pages/Contato";
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
import ClientPortalDashboard from "./pages/ClientPortalDashboard";
import ClientRequestForm from "./pages/ClientRequestForm";
import ClientRequests from "./pages/ClientRequests";
import ClientRequestDetail from "./pages/ClientRequestDetail";
import ClientFinancial from "./pages/ClientFinancial";
import ClientPackage from "./pages/ClientPackage";
import ClientProfile from "./pages/ClientProfile";
import ClientRequestsAdmin from "./pages/admin/ClientRequestsAdmin";
import TicketsBoard from "./pages/admin/TicketsBoard";
import CollaboratorDashboard from "./pages/CollaboratorDashboard";
import CollaboratorTasks from "./pages/CollaboratorTasks";
import NotFound from "./pages/NotFound";
import { AuthLayout } from "./components/AuthLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/servicos" element={<Servicos />} />
              <Route path="/fundadora" element={<Fundadora />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/ativar-conta" element={<FirstAccess />} />
              <Route path="/ativar-colaborador" element={<FirstAccessCollaborator />} />
              
              <Route element={<AuthLayout />}>
                {/* Admin/Owner Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={["Owner", "Admin"]}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/clients" element={
                  <ProtectedRoute allowedRoles={["Owner", "Admin"]}>
                    <Clients />
                  </ProtectedRoute>
                } />
                <Route path="/clients/:id" element={
                  <ProtectedRoute allowedRoles={["Owner", "Admin"]}>
                    <ClientDetail />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:id" element={
                  <ProtectedRoute allowedRoles={["Owner", "Admin"]}>
                    <ProjectDetail />
                  </ProtectedRoute>
                } />
                <Route path="/projetos" element={
                  <ProtectedRoute allowedRoles={["Owner", "Admin"]}>
                    <Projetos />
                  </ProtectedRoute>
                } />
                <Route path="/usuarios" element={
                  <ProtectedRoute allowedRoles={["Owner", "Admin"]}>
                    <Usuarios />
                  </ProtectedRoute>
                } />
                <Route path="/reports/financial" element={
                  <ProtectedRoute allowedRoles={["Owner", "Admin"]}>
                    <FinancialReport />
                  </ProtectedRoute>
                } />
                <Route path="/admin/requests" element={
                  <ProtectedRoute allowedRoles={["Owner", "Admin"]}>
                    <ClientRequestsAdmin />
                  </ProtectedRoute>
                } />
                <Route path="/admin/tickets" element={
                  <ProtectedRoute allowedRoles={["Owner", "Admin"]}>
                    <TicketsBoard />
                  </ProtectedRoute>
                } />

                {/* Shared Routes */}
                <Route path="/configuracoes" element={<Configuracoes />} />

                {/* Client Portal Routes */}
                <Route path="/client-portal/dashboard" element={
                  <ProtectedRoute allowedRoles={["Cliente", "Owner", "Admin"]}>
                    <ClientPortalDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/client-portal/request" element={
                  <ProtectedRoute allowedRoles={["Cliente", "Owner", "Admin"]}>
                    <ClientRequestForm />
                  </ProtectedRoute>
                } />
                <Route path="/client-portal/requests" element={
                  <ProtectedRoute allowedRoles={["Cliente", "Owner", "Admin"]}>
                    <ClientRequests />
                  </ProtectedRoute>
                } />
                <Route path="/client-portal/requests/:id" element={
                  <ProtectedRoute allowedRoles={["Cliente", "Owner", "Admin"]}>
                    <ClientRequestDetail />
                  </ProtectedRoute>
                } />
                <Route path="/client-portal/financial" element={
                  <ProtectedRoute allowedRoles={["Cliente", "Owner", "Admin"]}>
                    <ClientFinancial />
                  </ProtectedRoute>
                } />
                <Route path="/client-portal/package" element={
                  <ProtectedRoute allowedRoles={["Cliente", "Owner", "Admin"]}>
                    <ClientPackage />
                  </ProtectedRoute>
                } />
                <Route path="/client-portal/profile" element={
                  <ProtectedRoute allowedRoles={["Cliente", "Owner", "Admin"]}>
                    <ClientProfile />
                  </ProtectedRoute>
                } />
                <Route path="/client-portal/tasks" element={
                  <ProtectedRoute allowedRoles={["Cliente", "Owner", "Admin"]}>
                    <ClientPortalTasks />
                  </ProtectedRoute>
                } />
                <Route path="/client-portal/tasks/:id" element={
                  <ProtectedRoute allowedRoles={["Cliente", "Owner", "Admin"]}>
                    <ClientPortalTaskDetail />
                  </ProtectedRoute>
                } />

                {/* Collaborator Routes */}
                <Route path="/collaborator/dashboard" element={
                  <ProtectedRoute allowedRoles={["Colaborador", "Editor de Vídeo", "Social Mídia", "Webdesigner", "Administrativo", "Finance"]}>
                    <CollaboratorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/collaborator/tasks" element={
                  <ProtectedRoute allowedRoles={["Colaborador", "Editor de Vídeo", "Social Mídia", "Webdesigner", "Administrativo", "Finance"]}>
                    <CollaboratorTasks />
                  </ProtectedRoute>
                } />
                <Route path="/collaborator/tasks/:id" element={
                  <ProtectedRoute allowedRoles={["Colaborador", "Editor de Vídeo", "Social Mídia", "Webdesigner", "Administrativo", "Finance"]}>
                    <ClientPortalTaskDetail />
                  </ProtectedRoute>
                } />
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
