import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  subscriptionFilter: string;
  onSubscriptionFilterChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  onClearFilters: () => void;
  hasFilters: boolean;
}

export function UserFilters({
  search,
  onSearchChange,
  subscriptionFilter,
  onSubscriptionFilterChange,
  roleFilter,
  onRoleFilterChange,
  onClearFilters,
  hasFilters,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={subscriptionFilter} onValueChange={onSubscriptionFilterChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Subscription" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Subscriptions</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="trialing">Trial</SelectItem>
          <SelectItem value="admin_granted">Admin Granted</SelectItem>
          <SelectItem value="canceled">Canceled</SelectItem>
          <SelectItem value="none">No Subscription</SelectItem>
        </SelectContent>
      </Select>
      <Select value={roleFilter} onValueChange={onRoleFilterChange}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="admin">Admins Only</SelectItem>
          <SelectItem value="user">Users Only</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={onClearFilters} title="Clear filters">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
