import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera } from 'lucide-react';

export default function Pictures() {
  const navigate = useNavigate();
  const [who, setWho] = useState<string>('');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Helmet>
        <title>Graduation Photo Review</title>
        <meta name="description" content="Choose your photos to keep from the graduation shoot." />
      </Helmet>
      <div className="w-full max-w-md text-center space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Graduation Photos</h1>
          <p className="text-muted-foreground">
            Pick who you are to start reviewing your photos.
          </p>
        </div>

        <div className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
          <Select value={who} onValueChange={setWho}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select your name" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user-1">User 1 — Brittney</SelectItem>
              <SelectItem value="user-2">User 2</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="w-full h-12 text-base"
            disabled={!who}
            onClick={() => navigate(`/pictures/${who}`)}
          >
            View My Photos
          </Button>
        </div>
      </div>
    </div>
  );
}
