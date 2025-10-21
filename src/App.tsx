import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { queryClient } from "@/lib/queryClient";

// Lazy load pages for better initial load performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Deals = lazy(() => import("./pages/Deals"));
const DealDetail = lazy(() => import("./pages/DealDetail"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Companies = lazy(() => import("./pages/Companies"));
const Calls = lazy(() => import("./pages/Calls"));
const Reports = lazy(() => import("./pages/Reports"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Tasks = lazy(() => import("./pages/Tasks"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Admin = lazy(() => import("./pages/Admin"));
const JobPostings = lazy(() => import("./pages/JobPostings"));
const JobPostingsLanding = lazy(() => import("./pages/JobPostingsLanding"));
const OAuthDialpadCallback = lazy(() => import("./pages/OAuthDialpadCallback"));
const EODReports = lazy(() => import("./pages/EODReports"));
const EODLogin = lazy(() => import("./pages/EODLogin"));
const EODPortal = lazy(() => import("./pages/EODPortal"));
const EODDashboard = lazy(() => import("./pages/EODDashboard"));
const Settings = lazy(() => import("./pages/Settings"));

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Admin-only CRM routes */}
              <Route path="/" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />
              <Route path="/deals" element={<ProtectedRoute requireAdmin><Deals /></ProtectedRoute>} />
              <Route path="/deals/:id" element={<ProtectedRoute requireAdmin><DealDetail /></ProtectedRoute>} />
              <Route path="/contacts" element={<ProtectedRoute requireAdmin><Contacts /></ProtectedRoute>} />
              <Route path="/companies" element={<ProtectedRoute requireAdmin><Companies /></ProtectedRoute>} />
              <Route path="/calls" element={<ProtectedRoute requireAdmin><Calls /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute requireAdmin><Reports /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute requireAdmin><Calendar /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute requireAdmin><Tasks /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute requireAdmin><JobPostings /></ProtectedRoute>} />
              <Route path="/eod-dashboard" element={<ProtectedRoute requireAdmin><EODDashboard /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute requireAdmin><Settings /></ProtectedRoute>} />
              <Route path="/oauth/dialpad/callback" element={<ProtectedRoute requireAdmin><OAuthDialpadCallback /></ProtectedRoute>} />
              
              {/* Public and EOD routes */}
              <Route path="/eod-login" element={<EODLogin />} />
              <Route path="/eod-portal" element={<EODPortal />} />
              <Route path="/jobpostings" element={<JobPostingsLanding />} />
              <Route path="/login" element={<Login />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
