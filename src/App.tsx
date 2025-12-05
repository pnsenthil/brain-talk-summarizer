import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Queue from "./pages/Queue";
import Consultation from "./pages/Consultation";
import Consultations from "./pages/Consultations";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PatientPortal from "./pages/PatientPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/patient" element={
              <ProtectedRoute>
                <PatientPortal />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Header />
                  <div className="flex">
                    <Sidebar />
                    <main className="flex-1 ml-64 p-8 pt-6">
                      <Navigate to="/dashboard" replace />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Header />
                  <div className="flex">
                    <Sidebar />
                    <main className="flex-1 ml-64 p-8 pt-6">
                      <Dashboard />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/queue" element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Header />
                  <div className="flex">
                    <Sidebar />
                    <main className="flex-1 ml-64 p-8 pt-6">
                      <Queue />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/consultation/:id" element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Header />
                  <div className="flex">
                    <Sidebar />
                    <main className="flex-1 ml-64 p-8 pt-6">
                      <Consultation />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/consultations" element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Header />
                  <div className="flex">
                    <Sidebar />
                    <main className="flex-1 ml-64 p-8 pt-6">
                      <Consultations />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
