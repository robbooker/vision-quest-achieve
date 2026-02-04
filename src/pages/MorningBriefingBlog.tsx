import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sunrise, Calendar, Cloud, Newspaper, Settings, Play, Home } from 'lucide-react';

export default function MorningBriefingBlog() {
  return (
    <>
      <Helmet>
        <title>Morning Briefing: Your Personal AI Podcast | GrowthPath</title>
        <meta name="description" content="Learn how to set up your personalized AI morning briefing - a custom audio podcast covering your calendar, weather, and news topics delivered to your Today page." />
        <meta property="og:title" content="Morning Briefing: Your Personal AI Podcast" />
        <meta property="og:description" content="Wake up to a personalized AI podcast covering your calendar, weather, and custom news topics." />
        <meta property="og:type" content="article" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Back navigation */}
          <Link to="/blog">
            <Button variant="ghost" size="sm" className="mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          {/* Hero */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <Sunrise className="h-8 w-8 text-amber-500" />
              </div>
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Feature Guide
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Morning Briefing: Your Personal AI Podcast
            </h1>
            <p className="text-xl text-muted-foreground">
              Wake up to a custom 3-minute audio briefing covering your calendar, weather, and the news topics that matter to you.
            </p>
          </header>

          {/* Article content */}
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <h2>What is Morning Briefing?</h2>
            <p>
              Morning Briefing is an AI-generated personalized audio podcast created for you each morning. Think of it as your own personal news anchor who knows exactly what you care about.
            </p>
            
            <p>
              Each briefing is about 3 minutes long and covers:
            </p>
            
            <ul>
              <li><strong>Your Calendar</strong> — What meetings and events you have today</li>
              <li><strong>Local Weather</strong> — Current conditions and today's forecast for your location</li>
              <li><strong>Custom News</strong> — Updates on topics you've specified (stocks, industries, world events, etc.)</li>
            </ul>

            <h2>How It Works</h2>
            
            <div className="not-prose my-8 grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-3 mb-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <span className="font-semibold">1. Configure</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Set your wake time, location, and write a paragraph describing your news interests.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="font-semibold">2. Connect Calendar</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Link your Google Calendar so the briefing knows your schedule.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-3 mb-2">
                  <Play className="h-5 w-5 text-primary" />
                  <span className="font-semibold">3. Generate</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  15 minutes before your wake time, the AI creates your personalized briefing.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-3 mb-2">
                  <Home className="h-5 w-5 text-primary" />
                  <span className="font-semibold">4. Listen on Today</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your briefing appears on the Today page. Just tap play to listen!
                </p>
              </div>
            </div>

            <h2>Setting Up Your Briefing</h2>
            
            <h3>Step 1: Enable Morning Briefing</h3>
            <p>
              Go to <strong>Settings → Morning Briefing</strong> and toggle it on. This reveals all the configuration options.
            </p>

            <h3>Step 2: Set Your Location</h3>
            <p>
              Click <strong>"Use Current Location"</strong> to save your coordinates for weather forecasts. The app will detect your city name automatically.
            </p>

            <h3>Step 3: Write Your Topic Instructions</h3>
            <p>
              This is the most important part! Write a paragraph describing what news topics you care about and how you want them covered. For example:
            </p>
            
            <blockquote className="not-prose border-l-4 border-primary/30 pl-4 my-6 italic text-muted-foreground">
              "Cover any SMCI and NVDA earnings news, FDA approvals in biotech, and tariff developments with China. If there's big market news, lead with that. Keep it focused on actionable information."
            </blockquote>

            <h3>Step 4: Enable SMS Delivery (Optional)</h3>
            <p>
              Turn on <strong>"Send me an SMS when my briefing is ready"</strong> to get a text notification when your briefing is generated. You'll also be able to play it directly from the Today page.
            </p>

            <h3>Step 5: Generate a Test Episode</h3>
            <p>
              Click <strong>"Generate Test Briefing"</strong> to create a sample episode. You can play it directly in Settings to make sure everything sounds right.
            </p>

            <h2>Listening to Your Briefing</h2>
            <p>
              Once your briefing is ready, it will appear at the top of your <strong>Today page</strong> as a player widget. Just tap Play to listen while you start your day.
            </p>

            <p>
              You can also view the full transcript by expanding the "View Transcript" section below the player.
            </p>

            <h2>Tips for Best Results</h2>
            
            <div className="not-prose my-8 space-y-4">
              <div className="flex gap-4 p-4 border rounded-lg bg-card">
                <Newspaper className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Be specific with topics</p>
                  <p className="text-sm text-muted-foreground">
                    Instead of "tech news," try "Apple product announcements, AI startup funding rounds, and major semiconductor news."
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 border rounded-lg bg-card">
                <Cloud className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Update your location when traveling</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Use Current Location" again if you're in a new city to get local weather.
                  </p>
                </div>
              </div>
            </div>

            <h2>Weekend Mode</h2>
            <p>
              By default, Morning Briefing only runs on weekdays. If you want weekend briefings too, enable <strong>"Weekend Briefings"</strong> in Settings.
            </p>

            <h2>Voice Selection</h2>
            <p>
              Choose from several AI voices to find one that fits your preference. George is the default — a warm, conversational voice that sounds like a real podcaster.
            </p>

            <hr className="my-8" />

            <p className="text-center">
              Ready to start your mornings informed?{' '}
              <Link to="/settings" className="text-primary hover:underline">
                Set up your Morning Briefing →
              </Link>
            </p>
          </article>
        </div>
      </div>
    </>
  );
}
