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

import { TerminalModeProvider } from "@/hooks/useTerminalMode";
import { GlobalChatProvider } from "@/hooks/useGlobalChat";
import { ToastProvider } from "@/components/notifications/ToastProvider";
import { NotificationListener } from "@/components/notifications/NotificationListener";
import { JournalChat } from "@/components/journal/JournalChat";
import { MiamiModeProvider } from "@/hooks/useMiamiMode";
import { Retro1971Provider } from "@/hooks/useRetro1971";
import { SiteTourProvider } from "@/hooks/useSiteTour";
import Index from "./pages/Index";
import Auth from "./pages/Auth";

import { CursorTrail } from "@/components/CursorTrail";
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
import AdminChangelog from "./pages/AdminChangelog";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Blog from "./pages/Blog";
import HabitGoalsBlog from "./pages/HabitGoalsBlog";
import WoopBlog from "./pages/WoopBlog";
import ResetBlog from "./pages/ResetBlog";
import Reset from "./pages/Reset";
import Journal from "./pages/Journal";
import Tasks from "./pages/Tasks";
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
import PublicBirdGallery from "./pages/PublicBirdGallery";
import PublicRecap from "./pages/PublicRecap";
import TradingPnL from "./pages/TradingPnL";
import Primed from "./pages/Primed";
import PhysicalPillar from "./pages/PhysicalPillar";
import Spiritual from "./pages/Spiritual";
import Notes from "./pages/Notes";
import PublicListView from "./pages/PublicListView";
import JanuaryAudit from "./pages/JanuaryAudit";
import WhatsNew from "./pages/WhatsNew";
import MonthInReviewBlog from "./pages/MonthInReviewBlog";
import MorningBriefingBlog from "./pages/MorningBriefingBlog";

import Sprints from "./pages/Sprints";
import MorningBriefingLab from "./pages/MorningBriefingLab";
import Team from "./pages/Team";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
    },
  },
});

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
          <Retro1971Provider>
          <TerminalModeProvider>
            <SiteTourProvider>
            <GlobalChatProvider>
            <ToastProvider>
            <TooltipProvider>
              <TextSizeInitializer />
              <CursorTrail />
              <Toaster />
              <Sonner />
              <NotificationListener />
              <BrowserRouter>
                <div>
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
                    <Route path="/blog/month-in-review" element={<MonthInReviewBlog />} />
                    <Route path="/blog/morning-briefing" element={<MorningBriefingBlog />} />
                    <Route path="/morning-briefing" element={<ProtectedRoute><MorningBriefingLab /></ProtectedRoute>} />
                    <Route path="/whats-new" element={<WhatsNew />} />
                    <Route path="/primed" element={<ProtectedRoute><Primed /></ProtectedRoute>} />
                    <Route path="/primed/physical" element={<ProtectedRoute><PhysicalPillar /></ProtectedRoute>} />
                    <Route path="/spiritual" element={<ProtectedRoute><Spiritual /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/today" element={<ProtectedRoute><Today /></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                    <Route path="/vision" element={<ProtectedRoute><Vision /></ProtectedRoute>} />
                    <Route path="/big-ten" element={<ProtectedRoute><BigTen /></ProtectedRoute>} />
                    <Route path="/focus" element={<ProtectedRoute><Focus /></ProtectedRoute>} />
                    <Route path="/reset" element={<ProtectedRoute><Reset /></ProtectedRoute>} />
                    <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
                    <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                    <Route path="/books" element={<ProtectedRoute><Books /></ProtectedRoute>} />
                    <Route path="/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
                    <Route path="/affirmations" element={<ProtectedRoute><Affirmations /></ProtectedRoute>} />
                    <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
                    <Route path="/birdwatching" element={<ProtectedRoute><Birdwatching /></ProtectedRoute>} />
                    <Route path="/birds/:username" element={<PublicBirdProfile />} />
                    <Route path="/birds/:username/gallery" element={<PublicBirdGallery />} />
                    <Route path="/recap/:slug" element={<PublicRecap />} />
                    <Route path="/list/view/:token" element={<PublicListView />} />
                    <Route path="/monthly-audit" element={<ProtectedRoute><JanuaryAudit /></ProtectedRoute>} />
                    <Route path="/monthly-audit/:month" element={<ProtectedRoute><JanuaryAudit /></ProtectedRoute>} />
                    <Route path="/trading" element={<ProtectedRoute><TradingPnL /></ProtectedRoute>} />
                    <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
                    <Route path="/lists" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
                    <Route path="/sprints" element={<ProtectedRoute><Sprints /></ProtectedRoute>} />
                    <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
                    <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                    <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                    <Route path="/admin/broadcasts" element={<AdminRoute><AdminBroadcasts /></AdminRoute>} />
                    <Route path="/admin/feedback" element={<AdminRoute><AdminFeedback /></AdminRoute>} />
                    
                    <Route path="/admin/changelog" element={<AdminRoute><AdminChangelog /></AdminRoute>} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/secret" element={<Secret />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                    <JournalChat />
                  </div>
                </BrowserRouter>
            </TooltipProvider>
            </ToastProvider>
            </GlobalChatProvider>
            </SiteTourProvider>
          </TerminalModeProvider>
          </Retro1971Provider>
          </MiamiModeProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
