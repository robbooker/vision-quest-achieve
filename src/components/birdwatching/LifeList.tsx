import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { List, Sparkles, ChevronRight } from 'lucide-react';
import { useBirdwatching } from '@/hooks/useBirdwatching';
import { format } from 'date-fns';

interface LifeListProps {
  onSelectSpecies: (species: string) => void;
}

export function LifeList({ onSelectSpecies }: LifeListProps) {
  const { lifeList, sightingsLoading } = useBirdwatching();

  if (sightingsLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  if (lifeList.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <List className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Your Life List is Empty</h3>
          <p className="text-sm text-muted-foreground">
            Log your first bird sighting to start building your life list!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          Life List
          <Badge variant="secondary" className="ml-2">
            {lifeList.length} species
          </Badge>
        </CardTitle>
        <CardDescription>
          All the unique species you've ever spotted
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {lifeList.map(bird => (
            <button
              key={bird.species}
              onClick={() => onSelectSpecies(bird.species)}
              className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                  🐦
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{bird.species}</span>
                    {bird.isNew && (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                        <Sparkles className="h-3 w-3 mr-1" />
                        NEW!
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {bird.count} sighting{bird.count !== 1 ? 's' : ''} • First seen {format(new Date(bird.firstSeen), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
