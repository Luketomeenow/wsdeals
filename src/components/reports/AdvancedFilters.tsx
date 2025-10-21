import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  rep: string;
  compareRep?: string;
  pipeline: string;
  callOutcome: string;
  emailStatus: string;
  priority: string;
  period?: 'month' | 'quarter' | 'year' | '';
  year?: string;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  reps: Array<{ id: string; name: string }>;
  pipelines: Array<{ id: string; name: string }>;
}

const callOutcomes = [
  "no answer", "voicemail", "connected", "DM", "DM short story", 
  "DM discovery", "DM presentation", "strategy call booked", "nurturing", "do not call"
];

const emailStatuses = ["sent", "delivered", "opened", "clicked", "bounced", "failed"];
const priorities = ["high", "medium", "low"];

export function AdvancedFilters({ filters, onFiltersChange, reps, pipelines }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof FilterState) => {
    if (key === 'dateRange') {
      updateFilter(key, { from: undefined, to: undefined });
    } else {
      updateFilter(key, '');
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: { from: undefined, to: undefined },
      rep: '',
      pipeline: '',
      callOutcome: '',
      emailStatus: '',
      priority: ''
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.rep) count++;
    if (filters.compareRep) count++;
    if (filters.pipeline) count++;
    if (filters.callOutcome) count++;
    if (filters.emailStatus) count++;
    if (filters.priority) count++;
    if (filters.period) count++;
    if (filters.year) count++;
    return count;
  };

  const isValidDate = (d: any) => d instanceof Date && !isNaN(d?.getTime?.());
  const fromLabel = isValidDate(filters.dateRange.from) ? (filters.dateRange.from as Date).toLocaleDateString() : '';
  const toLabel = isValidDate(filters.dateRange.to) ? (filters.dateRange.to as Date).toLocaleDateString() : '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Advanced Filters</span>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">{getActiveFiltersCount()}</Badge>
            )}
          </CardTitle>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? 'Hide' : 'Show'} Filters
            </Button>
            {getActiveFiltersCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="space-y-4">
          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !filters.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromLabel ? (toLabel ? `${fromLabel} - ${toLabel}` : fromLabel) : <span>Pick a date range</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={isValidDate(filters.dateRange.from) ? filters.dateRange.from : undefined}
                    selected={filters.dateRange}
                    onSelect={(range) => updateFilter('dateRange', range || { from: undefined, to: undefined })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              {(filters.dateRange.from || filters.dateRange.to) && (
                <Button variant="ghost" size="sm" onClick={() => clearFilter('dateRange')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Rep Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sales Rep</label>
            <div className="flex space-x-2">
              <Select value={filters.rep} onValueChange={(value) => updateFilter('rep', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a rep" />
                </SelectTrigger>
                <SelectContent>
                  {reps.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id}>
                      {rep.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.rep && (
                <Button variant="ghost" size="sm" onClick={() => clearFilter('rep')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Compare Rep */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Compare With Rep</label>
            <div className="flex space-x-2">
              <Select value={filters.compareRep || ''} onValueChange={(value) => updateFilter('compareRep', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a rep to compare" />
                </SelectTrigger>
                <SelectContent>
                  {reps.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id}>
                      {rep.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.compareRep && (
                <Button variant="ghost" size="sm" onClick={() => updateFilter('compareRep', '')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Pipeline Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pipeline</label>
            <div className="flex space-x-2">
              <Select value={filters.pipeline} onValueChange={(value) => updateFilter('pipeline', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.pipeline && (
                <Button variant="ghost" size="sm" onClick={() => clearFilter('pipeline')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Call Outcome Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Call Outcome</label>
            <div className="flex space-x-2">
              <Select value={filters.callOutcome} onValueChange={(value) => updateFilter('callOutcome', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  {callOutcomes.map((outcome) => (
                    <SelectItem key={outcome} value={outcome}>
                      {outcome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.callOutcome && (
                <Button variant="ghost" size="sm" onClick={() => clearFilter('callOutcome')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Email Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Status</label>
            <div className="flex space-x-2">
              <Select value={filters.emailStatus} onValueChange={(value) => updateFilter('emailStatus', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {emailStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.emailStatus && (
                <Button variant="ghost" size="sm" onClick={() => clearFilter('emailStatus')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <div className="flex space-x-2">
              <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.priority && (
                <Button variant="ghost" size="sm" onClick={() => clearFilter('priority')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Period & Year */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Select
                value={filters.period || 'custom'}
                onValueChange={(value) => updateFilter('period', value === 'custom' ? '' : (value as any))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={filters.year || 'none'} onValueChange={(value) => updateFilter('year', value === 'none' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any</SelectItem>
                  {Array.from({ length: 6 }).map((_, idx) => {
                    const y = String(new Date().getFullYear() - idx);
                    return (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}