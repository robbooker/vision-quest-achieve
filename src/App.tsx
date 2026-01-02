import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { TerminalModeProvider } from "@/hooks/useTerminalMode";
import { GlobalChatProvider } from "@/hooks/useGlobalChat";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Today from "./pages/Today";
import Reports from "./pages/Reports";
import Vision from "./pages/Vision";
import BigTen from "./pages/BigTen";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
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
          <TooltipProvider>
            <TextSizeInitializer />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/today" element={<ProtectedRoute><Today /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/vision" element={<ProtectedRoute><Vision /></ProtectedRoute>} />
                <Route path="/big-ten" element={<ProtectedRoute><BigTen /></ProtectedRoute>} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <InstallPrompt />
          </TooltipProvider>
          </GlobalChatProvider>
        </TerminalModeProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
