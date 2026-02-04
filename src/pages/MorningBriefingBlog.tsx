import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sunrise, Calendar, Cloud, Newspaper, Smartphone, Settings, Play, Key } from 'lucide-react';

export default function MorningBriefingBlog() {
  return (
    <>
      <Helmet>
        <title>Morning Briefing: Your Personal AI Podcast | GrowthPath</title>
        <meta name="description" content="Learn how to set up your personalized AI morning briefing - a custom audio podcast covering your calendar, weather, and news topics delivered right when you wake up." />
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
              Morning Briefing is an AI-generated personalized audio podcast that plays automatically when you wake up. Think of it as your own personal news anchor who knows exactly what you care about.
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
                  <Smartphone className="h-5 w-5 text-primary" />
                  <span className="font-semibold">4. Listen</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  An iOS Shortcut plays your briefing automatically when you turn off your alarm.
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

            <h3>Step 4: Generate a Test Episode</h3>
            <p>
              Click <strong>"Generate Test Briefing"</strong> to create a sample episode. You can play it directly in Settings to make sure everything sounds right before setting up the automation.
            </p>

            <h2>iOS Shortcut Setup</h2>
            <p>
              To have your briefing play automatically when you wake up, you'll need to create an iOS Shortcut. Here's how:
            </p>

            <h3>Get Your API Key</h3>
            <p>
              In Settings → Morning Briefing, scroll to the bottom and click the refresh icon to generate an API key. Copy it to your clipboard.
            </p>

            <h3>Create the Shortcut</h3>
            <ol>
              <li>Open the <strong>Shortcuts</strong> app on your iPhone</li>
              <li>Create a new shortcut called "Morning Briefing"</li>
              <li>Add a <strong>"Get Contents of URL"</strong> action with:
                <ul>
                  <li>URL: <code>https://gogzkyjylruuziseprfw.supabase.co/functions/v1/briefing-wake-check</code></li>
                  <li>Method: GET</li>
                  <li>Header: <code>Authorization: Bearer YOUR_API_KEY</code></li>
                </ul>
              </li>
              <li>Add a <strong>"Get Dictionary Value"</strong> action to extract <code>podcast_url</code></li>
              <li>Add a <strong>"Play Sound"</strong> action with the URL</li>
            </ol>

            <h3>Set Up Automation</h3>
            <ol>
              <li>Go to <strong>Automation</strong> tab in Shortcuts</li>
              <li>Create a new <strong>Personal Automation</strong></li>
              <li>Choose <strong>"Alarm" → "Is Stopped"</strong></li>
              <li>Select your wake-up alarm(s)</li>
              <li>Add action: <strong>Run Shortcut → Morning Briefing</strong></li>
              <li>Turn off "Ask Before Running"</li>
            </ol>

            <p>
              Now when you dismiss your morning alarm, your personalized briefing will start playing automatically!
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
              
              <div className="flex gap-4 p-4 border rounded-lg bg-card">
                <Key className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Regenerate your API key if needed</p>
                  <p className="text-sm text-muted-foreground">
                    If your shortcut stops working, try generating a new API key and updating the shortcut.
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
