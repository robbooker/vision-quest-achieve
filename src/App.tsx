import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { TerminalModeProvider } from "@/hooks/useTerminalMode";
import { GlobalChatProvider } from "@/hooks/useGlobalChat";
import { ToastProvider } from "@/components/notifications/ToastProvider";
import { NotificationListener } from "@/components/notifications/NotificationListener";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Today from "./pages/Today";
import Reports from "./pages/Reports";
import Vision from "./pages/Vision";
import BigTen from "./pages/BigTen";
import Admin from "./pages/Admin";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Blog from "./pages/Blog";
import HabitGoalsBlog from "./pages/HabitGoalsBlog";
import ResetBlog from "./pages/ResetBlog";
import Reset from "./pages/Reset";
import Journal from "./pages/Journal";
import Focus from "./pages/Focus";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Apply saved text size on app load
function TextSizeInitializer() {
  useEffect(() => {
    const savedSize = localStorage.getItem('textSize');
    if (savedSize && ['small', 'medium', 'large'].includes(savedSize)) {
      document.documentElement.classList.add(`text-size-${savedSize}`);
    }
  }, []);
  return null;
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem
        themes={['light', 'dark', 'terminal']}
      >
        <AuthProvider>
          <TerminalModeProvider>
            <GlobalChatProvider>
            <ToastProvider>
            <TooltipProvider>
              <TextSizeInitializer />
              <Toaster />
              <Sonner />
              <NotificationListener />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/habit-goals" element={<HabitGoalsBlog />} />
                  <Route path="/blog/reset" element={<ResetBlog />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/today" element={<ProtectedRoute><Today /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/vision" element={<ProtectedRoute><Vision /></ProtectedRoute>} />
                  <Route path="/big-ten" element={<ProtectedRoute><BigTen /></ProtectedRoute>} />
                  <Route path="/focus" element={<ProtectedRoute><Focus /></ProtectedRoute>} />
                  <Route path="/reset" element={<ProtectedRoute><Reset /></ProtectedRoute>} />
                  <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
                  <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
                  <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              <InstallPrompt />
            </TooltipProvider>
            </ToastProvider>
            </GlobalChatProvider>
          </TerminalModeProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
