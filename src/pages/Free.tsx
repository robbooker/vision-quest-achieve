import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import gpLogo from '@/assets/gp-logo.png';

export default function Free() {
  // Load Wistia scripts
  useEffect(() => {
    const jsonpScript = document.createElement('script');
    jsonpScript.src = 'https://fast.wistia.com/embed/medias/9b0gydu658.jsonp';
    jsonpScript.async = true;
    document.head.appendChild(jsonpScript);

    const wistiaScript = document.createElement('script');
    wistiaScript.src = 'https://fast.wistia.com/assets/external/E-v1.js';
    wistiaScript.async = true;
    document.head.appendChild(wistiaScript);

    return () => {
      if (jsonpScript.parentNode) jsonpScript.parentNode.removeChild(jsonpScript);
      if (wistiaScript.parentNode) wistiaScript.parentNode.removeChild(wistiaScript);
    };
  }, []);

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

            {/* Wistia Video Embed */}
            <div className="w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-lg">
              <div className="wistia_responsive_padding" style={{ padding: '64.79% 0 0 0', position: 'relative' }}>
                <div className="wistia_responsive_wrapper" style={{ height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' }}>
                  <div 
                    className="wistia_embed wistia_async_9b0gydu658 seo=true videoFoam=true" 
                    style={{ height: '100%', position: 'relative', width: '100%' }}
                  >
                    <div 
                      className="wistia_swatch" 
                      style={{ 
                        height: '100%', 
                        left: 0, 
                        opacity: 0, 
                        overflow: 'hidden', 
                        position: 'absolute', 
                        top: 0, 
                        transition: 'opacity 200ms', 
                        width: '100%' 
                      }}
                    >
                      <img 
                        src="https://fast.wistia.com/embed/medias/9b0gydu658/swatch" 
                        style={{ filter: 'blur(5px)', height: '100%', objectFit: 'contain', width: '100%' }} 
                        alt="" 
                        aria-hidden="true" 
                        onLoad={(e) => { (e.target as HTMLImageElement).parentElement!.style.opacity = '1'; }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
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
