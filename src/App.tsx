import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import Pricing from "./pages/Pricing";
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
import { JournalChat } from "@/components/journal/JournalChat";
import { MiamiModeProvider } from "@/hooks/useMiamiMode";
import { SiteTourProvider } from "@/hooks/useSiteTour";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Today from "./pages/Today";
import Reports from "./pages/Reports";
import Vision from "./pages/Vision";
import BigTen from "./pages/BigTen";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import AdminBroadcasts from "./pages/AdminBroadcasts";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Blog from "./pages/Blog";
import HabitGoalsBlog from "./pages/HabitGoalsBlog";
import WoopBlog from "./pages/WoopBlog";
import ResetBlog from "./pages/ResetBlog";
import Reset from "./pages/Reset";
import Journal from "./pages/Journal";
import Focus from "./pages/Focus";
import Secret from "./pages/Secret";
import Books from "./pages/Books";
import Trips from "./pages/Trips";
import Affirmations from "./pages/Affirmations";
import AffirmationsBlog from "./pages/AffirmationsBlog";
import NotFound from "./pages/NotFound";
import Free from "./pages/Free";
import Feedback from "./pages/Feedback";
import AdminFeedback from "./pages/AdminFeedback";
import Birdwatching from "./pages/Birdwatching";
import PublicBirdProfile from "./pages/PublicBirdProfile";
import MonthlyRecap from "./pages/MonthlyRecap";

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
          <MiamiModeProvider>
          <TerminalModeProvider>
            <SiteTourProvider>
            <GlobalChatProvider>
            <ToastProvider>
            <TooltipProvider>
              <TextSizeInitializer />
              <Toaster />
              <Sonner />
              <NotificationListener />
              <AnnouncementBar />
              <div className="pt-10">
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Auth />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/free" element={<Free />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/habit-goals" element={<HabitGoalsBlog />} />
                    <Route path="/blog/woop" element={<WoopBlog />} />
                    <Route path="/blog/reset" element={<ResetBlog />} />
                    <Route path="/blog/affirmations" element={<AffirmationsBlog />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/today" element={<ProtectedRoute><Today /></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                    <Route path="/vision" element={<ProtectedRoute><Vision /></ProtectedRoute>} />
                    <Route path="/big-ten" element={<ProtectedRoute><BigTen /></ProtectedRoute>} />
                    <Route path="/focus" element={<ProtectedRoute><Focus /></ProtectedRoute>} />
                    <Route path="/reset" element={<ProtectedRoute><Reset /></ProtectedRoute>} />
                    <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
                    <Route path="/books" element={<ProtectedRoute><Books /></ProtectedRoute>} />
                    <Route path="/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
                    <Route path="/affirmations" element={<ProtectedRoute><Affirmations /></ProtectedRoute>} />
                    <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
                    <Route path="/birdwatching" element={<ProtectedRoute><Birdwatching /></ProtectedRoute>} />
                    <Route path="/birds/:username" element={<PublicBirdProfile />} />
                    <Route path="/monthly-recap" element={<ProtectedRoute><MonthlyRecap /></ProtectedRoute>} />
                    <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                    <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                    <Route path="/admin/broadcasts" element={<AdminRoute><AdminBroadcasts /></AdminRoute>} />
                    <Route path="/admin/feedback" element={<AdminRoute><AdminFeedback /></AdminRoute>} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/secret" element={<Secret />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <JournalChat />
                </BrowserRouter>
              </div>
              <InstallPrompt />
            </TooltipProvider>
            </ToastProvider>
            </GlobalChatProvider>
            </SiteTourProvider>
          </TerminalModeProvider>
          </MiamiModeProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
