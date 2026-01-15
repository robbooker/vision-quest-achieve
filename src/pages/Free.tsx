import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import gpLogo from '@/assets/gp-logo.png';

export default function Free() {
  return (
    <>
      <Helmet>
        <title>Free Goal Planning App | Groovy Planning</title>
        <meta name="description" content="Plan your goals with our 100% free goal planning app. Create your free account and start achieving your dreams today." />
      </Helmet>
      
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="p-6 flex justify-center">
          <Link to="/" className="flex items-center gap-3">
            <img src={gpLogo} alt="Groovy Planning" className="h-12 w-12" />
            <span className="text-xl font-bold text-foreground">Groovy Planning</span>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-3xl w-full text-center space-y-8">
            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Make some plans. Future You will thank you.
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A 100% free goal planning app that helps you set meaningful goals, track your progress, and build habits that stick.
              </p>
            </div>

            {/* Video Embed */}
            <div className="aspect-video w-full max-w-2xl mx-auto rounded-lg overflow-hidden bg-muted border shadow-lg">
              {/* Replace the src with your video embed URL */}
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/VIDEO_ID_HERE"
                title="Groovy Planning Introduction"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <Button asChild size="lg" className="text-lg px-8 py-6 h-auto">
                <Link to="/auth">
                  Create your free account here
                </Link>
              </Button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Groovy Planning. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
