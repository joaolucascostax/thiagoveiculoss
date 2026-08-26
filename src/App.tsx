import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreSettingsProvider } from "@/contexts/StoreSettingsContext";
import Index from "./pages/Index.tsx";
import VehicleDetail from "./pages/VehicleDetail.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLogin from "./pages/admin/AdminLogin.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import VehicleList from "./pages/admin/VehicleList.tsx";
import VehicleForm from "./pages/admin/VehicleForm.tsx";
import StoreSettingsPage from "./pages/admin/StoreSettings.tsx";
import Analytics from "./pages/admin/Analytics.tsx";
import LeadsPage from "./pages/admin/Leads.tsx";
import HelpPage from "./pages/admin/Help.tsx";
import AudiencesPage from "./pages/admin/Audiences.tsx";
import ReportsPage from "./pages/admin/Reports.tsx";
import CatalogPage from "./pages/admin/Catalog.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import ProtectedRoute from "./components/admin/ProtectedRoute.tsx";
import { captureUtms } from "@/lib/tracking";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    captureUtms();
  }, []);
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StoreSettingsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/veiculo/:id" element={<VehicleDetail />} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="veiculos" element={<VehicleList />} />
              <Route path="veiculos/novo" element={<VehicleForm />} />
              <Route path="veiculos/:id/editar" element={<VehicleForm />} />
              <Route path="configuracoes" element={<StoreSettingsPage />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="publicos" element={<AudiencesPage />} />
              <Route path="relatorios" element={<ReportsPage />} />
              <Route path="catalogo" element={<CatalogPage />} />
              <Route path="ajuda" element={<HelpPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StoreSettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
