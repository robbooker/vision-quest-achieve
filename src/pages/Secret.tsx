import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Palmtree, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMiamiMode } from '@/hooks/useMiamiMode';

export default function Secret() {
  const { isMiamiMode, toggleMiamiMode } = useMiamiMode();
  const [isHovering, setIsHovering] = useState(false);

  return (
    <>
      <Helmet>
        <title>🤫 Secret Zone | Groovy Planning</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold mb-4">
              🤫 Secret Zone
            </h1>
            <p className="text-muted-foreground">
              You found the hidden stuff. Nice work, detective.
            </p>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Palmtree className={`h-12 w-12 transition-colors duration-300 ${isMiamiMode ? 'text-pink-400' : 'text-muted-foreground'}`} />
              </div>
              <CardTitle className="text-2xl">Miami Mode</CardTitle>
              <CardDescription>
                Transport yourself to a neon-soaked sunset vibe
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 pb-8">
              <p className="text-sm text-center text-muted-foreground max-w-sm">
                {isMiamiMode 
                  ? "You're living that Vice City life. The whole app is now bathed in Miami sunset vibes." 
                  : "Enable Miami Mode to transform the app with pink and teal neon aesthetics."}
              </p>
              
              <button
                onClick={toggleMiamiMode}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className={`
                  relative px-8 py-4 rounded-xl font-bold text-lg uppercase tracking-wider
                  transition-all duration-300 transform
                  ${isHovering ? 'scale-105' : 'scale-100'}
                  ${isMiamiMode 
                    ? 'bg-gradient-to-r from-cyan-400 via-pink-500 to-orange-400 text-white shadow-[0_0_30px_rgba(236,72,153,0.5)]' 
                    : 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white shadow-lg hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]'
                  }
                `}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Sparkles className={`h-5 w-5 ${isHovering ? 'animate-pulse' : ''}`} />
                  {isMiamiMode ? 'Exit Miami' : 'Enter Miami'}
                  <Sparkles className={`h-5 w-5 ${isHovering ? 'animate-pulse' : ''}`} />
                </span>
                {isMiamiMode && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 via-pink-500 to-orange-400 animate-pulse opacity-50" />
                )}
              </button>

              {isMiamiMode && (
                <p className="text-xs text-pink-400 animate-pulse">
                  ✨ Miami vibes activated ✨
                </p>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-12">
            More secrets coming soon...
          </p>
        </div>
      </div>
    </>
  );
}
