import { useState, useMemo } from 'react';
import { ArrowLeft, Package, Plus, Sparkles, Check, X, ChevronDown, ChevronRight, RefreshCw, Briefcase, Luggage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trip, usePackingList, useTrips, PackingListItem } from '@/hooks/useTrips';
import { TripLogisticsSection } from './TripLogisticsSection';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

const categories = ['Documents', 'Tech', 'Clothing', 'Toiletries', 'Accessories', 'Activity-Specific', 'Miscellaneous'];

export function PackingListView({ trip, onBack }: PackingListViewProps) {
  const { user } = useAuth();
  const { packingList, togglePacked, deletePackingItem, addPackingItems, progressPercent, packedCount, totalCount } = usePackingList(trip.id);
  const { addMasterItem, masterItems } = useTrips();
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(categoryOrder));
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Miscellaneous');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemBagType, setNewItemBagType] = useState<'carry_on' | 'checked'>('checked');

  // Group items by bag type first (if flight), then by category
  const groupedItems = useMemo(() => {
    if (trip.has_flight) {
      const carryOnItems: Record<string, PackingListItem[]> = {};
      const checkedItems: Record<string, PackingListItem[]> = {};

      packingList.forEach((item) => {
        const target = item.bag_type === 'carry_on' ? carryOnItems : checkedItems;
        if (!target[item.category]) {
          target[item.category] = [];
        }
        target[item.category].push(item);
      });

      // Sort categories
      const sortCategories = (groups: Record<string, PackingListItem[]>) => {
        const sorted: Record<string, PackingListItem[]> = {};
        categoryOrder.forEach((cat) => {
          if (groups[cat]) sorted[cat] = groups[cat];
        });
        Object.keys(groups).forEach((cat) => {
          if (!sorted[cat]) sorted[cat] = groups[cat];
        });
        return sorted;
      };

      return {
        carry_on: sortCategories(carryOnItems),
        checked: sortCategories(checkedItems),
      };
    } else {
      const groups: Record<string, PackingListItem[]> = {};
      packingList.forEach((item) => {
        if (!groups[item.category]) {
          groups[item.category] = [];
        }
        groups[item.category].push(item);
      });

      const sortedGroups: Record<string, PackingListItem[]> = {};
      categoryOrder.forEach((cat) => {
        if (groups[cat]) sortedGroups[cat] = groups[cat];
      });
      Object.keys(groups).forEach((cat) => {
        if (!sortedGroups[cat]) sortedGroups[cat] = groups[cat];
      });

      return { all: sortedGroups };
    }
  }, [packingList, trip.has_flight]);

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

  const handleAddItem = async () => {
    if (!newItemName.trim() || !user?.id) return;

    await addPackingItems.mutateAsync([{
      trip_id: trip.id,
      user_id: user.id,
      item_name: newItemName.trim(),
      category: newItemCategory,
      quantity: newItemQuantity,
      is_packed: false,
      is_ai_suggested: false,
      bag_type: trip.has_flight ? newItemBagType : 'checked',
      master_item_id: null,
    }]);

    toast.success('Item added');
    setNewItemName('');
    setNewItemQuantity(1);
    setAddDialogOpen(false);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-packing-list', {
        body: {
          destination: trip.destination,
          startDate: trip.start_date,
          endDate: trip.end_date,
          purpose: trip.purpose,
          plannedActivities: trip.planned_activities,
          masterItems: masterItems,
          hasFlight: trip.has_flight,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Prepare items for insertion
      const itemsToAdd = data.items.map((item: any) => {
        const matchingMaster = masterItems.find(
          (mi) => mi.item_name.toLowerCase() === item.item_name.toLowerCase()
        );
        return {
          trip_id: trip.id,
          user_id: user?.id,
          item_name: item.item_name,
          category: item.category || 'General',
          quantity: item.quantity || 1,
          is_ai_suggested: true,
          is_packed: false,
          master_item_id: matchingMaster?.id || null,
          bag_type: item.bag_type || 'checked',
        };
      });

      if (itemsToAdd.length > 0) {
        await addPackingItems.mutateAsync(itemsToAdd);
        toast.success(`Added ${itemsToAdd.length} new items to your packing list!`);
      } else {
        toast.info('No new items to add');
      }
    } catch (err: any) {
      console.error('Failed to regenerate packing list:', err);
      toast.error(err.message || 'Failed to regenerate packing list');
    } finally {
      setIsRegenerating(false);
    }
  };

  const renderCategoryCard = (category: string, items: PackingListItem[], keyPrefix: string = '') => {
    const categoryPacked = items.filter((i) => i.is_packed).length;
    const isOpen = openCategories.has(category);

    return (
      <Card key={`${keyPrefix}${category}`} className="overflow-hidden">
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
  };

  const renderBagSection = (
    title: string,
    icon: React.ReactNode,
    items: Record<string, PackingListItem[]>,
    keyPrefix: string
  ) => {
    const allItems = Object.values(items).flat();
    const packed = allItems.filter((i) => i.is_packed).length;
    const total = allItems.length;

    if (total === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          {icon}
          {title}
          <Badge variant="outline" className="ml-2">
            {packed}/{total}
          </Badge>
        </div>
        {Object.entries(items).map(([category, catItems]) =>
          renderCategoryCard(category, catItems, keyPrefix)
        )}
      </div>
    );
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
            {trip.has_flight && (
              <Badge variant="secondary" className="ml-2 text-xs">
                ✈️ Flight
              </Badge>
            )}
          </p>
        </div>
      </div>

      {/* Logistics Section */}
      <TripLogisticsSection trip={trip} />

      {/* Progress Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="font-semibold">Packing Progress</span>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>Add Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="itemName">Item Name</Label>
                      <Input
                        id="itemName"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="e.g., Sunglasses"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min={1}
                          value={newItemQuantity}
                          onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                    {trip.has_flight && (
                      <div className="space-y-2">
                        <Label>Bag Type</Label>
                        <Select value={newItemBagType} onValueChange={(v) => setNewItemBagType(v as 'carry_on' | 'checked')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="carry_on">Carry-on</SelectItem>
                            <SelectItem value="checked">Checked Bag</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button onClick={handleAddItem} className="w-full" disabled={!newItemName.trim()}>
                      Add Item
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Generating...' : 'Regenerate'}
              </Button>
              <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
            </div>
          </div>
          <Progress value={progressPercent} className="h-3 mb-2" />
          <p className="text-sm text-muted-foreground">
            {packedCount} of {totalCount} items packed
          </p>
        </CardContent>
      </Card>

      {/* Packing List */}
      {trip.has_flight ? (
        <div className="space-y-8">
          {renderBagSection(
            'Carry-on Bag',
            <Briefcase className="h-5 w-5 text-primary" />,
            (groupedItems as { carry_on: Record<string, PackingListItem[]>; checked: Record<string, PackingListItem[]> }).carry_on,
            'carry_on_'
          )}
          {renderBagSection(
            'Checked Bag',
            <Luggage className="h-5 w-5 text-muted-foreground" />,
            (groupedItems as { carry_on: Record<string, PackingListItem[]>; checked: Record<string, PackingListItem[]> }).checked,
            'checked_'
          )}
        </div>
      ) : (
        Object.entries((groupedItems as { all: Record<string, PackingListItem[]> }).all).map(([category, items]) =>
          renderCategoryCard(category, items)
        )
      )}

      {packingList.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Items Yet</h3>
            <p className="text-muted-foreground mb-4">
              Your packing list is empty. Add items manually or regenerate with AI.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
              <Button onClick={handleRegenerate} disabled={isRegenerating}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                Generate with AI
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
