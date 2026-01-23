import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, Plus, Trash2, Loader2 } from 'lucide-react';
import { useBirdwatching } from '@/hooks/useBirdwatching';

export function Wishlist() {
  const { wishlist, wishlistLoading, addToWishlist, removeFromWishlist, lifeList } = useBirdwatching();
  const [newSpecies, setNewSpecies] = useState('');

  const handleAdd = async () => {
    if (!newSpecies.trim()) return;
    
    // Check if already in life list
    if (lifeList.some(b => b.species.toLowerCase() === newSpecies.toLowerCase())) {
      alert('You\'ve already spotted this bird!');
      return;
    }

    await addToWishlist.mutateAsync({ species_name: newSpecies.trim() });
    setNewSpecies('');
  };

  if (wishlistLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Want to See Wishlist
          {wishlist.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {wishlist.length} birds
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Birds you're hoping to spot. When you log a sighting, they'll move to your Life List!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a species to your wishlist..."
            value={newSpecies}
            onChange={(e) => setNewSpecies(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
          />
          <Button onClick={handleAdd} disabled={addToWishlist.isPending || !newSpecies.trim()}>
            {addToWishlist.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Wishlist Items */}
        {wishlist.length === 0 ? (
          <div className="py-8 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Birds on Your Wishlist</h3>
            <p className="text-sm text-muted-foreground">
              Add birds you're hoping to see!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {wishlist.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-red-400" />
                  <span className="font-medium">{item.species_name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromWishlist.mutate(item.id)}
                  disabled={removeFromWishlist.isPending}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
