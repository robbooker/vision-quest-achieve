import { useState, useMemo } from 'react';
import { ArrowLeft, Package, Plus, Sparkles, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trip, usePackingList, useTrips, PackingListItem } from '@/hooks/useTrips';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PackingListViewProps {
  trip: Trip;
  onBack: () => void;
}

const categoryOrder = [
  'Documents',
  'Tech',
  'Clothing',
  'Toiletries',
  'Accessories',
  'Activity-Specific',
  'Miscellaneous',
  'General',
];

export function PackingListView({ trip, onBack }: PackingListViewProps) {
  const { packingList, togglePacked, deletePackingItem, progressPercent, packedCount, totalCount } = usePackingList(trip.id);
  const { addMasterItem, masterItems } = useTrips();
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(categoryOrder));

  const groupedItems = useMemo(() => {
    const groups: Record<string, PackingListItem[]> = {};
    packingList.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    
    // Sort categories by predefined order
    const sortedGroups: Record<string, PackingListItem[]> = {};
    categoryOrder.forEach((cat) => {
      if (groups[cat]) {
        sortedGroups[cat] = groups[cat];
      }
    });
    // Add any remaining categories
    Object.keys(groups).forEach((cat) => {
      if (!sortedGroups[cat]) {
        sortedGroups[cat] = groups[cat];
      }
    });
    return sortedGroups;
  }, [packingList]);

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleAddToMaster = async (item: PackingListItem) => {
    const exists = masterItems.some(
      (mi) => mi.item_name.toLowerCase() === item.item_name.toLowerCase()
    );
    if (exists) {
      toast.info('Item already exists in your Master Locker');
      return;
    }
    await addMasterItem.mutateAsync({
      item_name: item.item_name,
      category: item.category,
      default_carry: false,
    });
  };

  const handleDelete = async (itemId: string) => {
    await deletePackingItem.mutateAsync(itemId);
    toast.success('Item removed');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{trip.destination}</h2>
          <p className="text-sm text-muted-foreground">
            {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="font-semibold">Packing Progress</span>
            </div>
            <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-3 mb-2" />
          <p className="text-sm text-muted-foreground">
            {packedCount} of {totalCount} items packed
          </p>
        </CardContent>
      </Card>

      {/* Packing List by Category */}
      {Object.entries(groupedItems).map(([category, items]) => {
        const categoryPacked = items.filter((i) => i.is_packed).length;
        const isOpen = openCategories.has(category);

        return (
          <Card key={category} className="overflow-hidden">
            <Collapsible open={isOpen} onOpenChange={() => toggleCategory(category)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <CardTitle className="text-base">{category}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {categoryPacked}/{items.length}
                      </Badge>
                    </div>
                    {categoryPacked === items.length && items.length > 0 && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-2">
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="group relative flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all"
                      >
                        <Checkbox
                          checked={item.is_packed}
                          onCheckedChange={(checked) =>
                            togglePacked.mutate({ itemId: item.id, isPacked: checked as boolean })
                          }
                          className="h-5 w-5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${
                                item.is_packed ? 'line-through text-muted-foreground' : ''
                              }`}
                            >
                              {item.item_name}
                            </span>
                            {item.quantity > 1 && (
                              <Badge variant="outline" className="text-xs">
                                ×{item.quantity}
                              </Badge>
                            )}
                            {item.is_ai_suggested && !item.master_item_id && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Sparkles className="h-3 w-3" />
                                AI
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.is_ai_suggested && !item.master_item_id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleAddToMaster(item)}
                              title="Add to Master Locker"
                            >
                              <Plus className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(item.id)}
                          >
                            <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {packingList.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Items Yet</h3>
            <p className="text-muted-foreground">
              Your packing list is empty. Create a new trip to generate an AI-powered list.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
