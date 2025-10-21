import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Filter, X, Search, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FilterState {
  stages: string[];
  priorities: string[];
  amountRange: [number, number];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  searchTerm: string;
  companies: string[];
  assignees: string[];
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  dealStages: string[];
  companies: Array<{ id: string; name: string }>;
  assignees: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onToggle: () => void;
}

const priorities = ['high', 'medium', 'low'];

export function AdvancedFilters({
  onFiltersChange,
  dealStages,
  companies,
  assignees,
  isOpen,
  onToggle
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    stages: [],
    priorities: [],
    amountRange: [0, 1000000],
    dateRange: {},
    searchTerm: '',
    companies: [],
    assignees: []
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.stages.length > 0) count++;
    if (filters.priorities.length > 0) count++;
    if (filters.amountRange[0] > 0 || filters.amountRange[1] < 1000000) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.searchTerm.trim()) count++;
    if (filters.companies.length > 0) count++;
    if (filters.assignees.length > 0) count++;
    
    setActiveFiltersCount(count);
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleStage = (stage: string) => {
    updateFilter('stages', 
      filters.stages.includes(stage) 
        ? filters.stages.filter(s => s !== stage)
        : [...filters.stages, stage]
    );
  };

  const togglePriority = (priority: string) => {
    updateFilter('priorities',
      filters.priorities.includes(priority)
        ? filters.priorities.filter(p => p !== priority)
        : [...filters.priorities, priority]
    );
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      stages: [],
      priorities: [],
      amountRange: [0, 1000000],
      dateRange: {},
      searchTerm: '',
      companies: [],
      assignees: []
    };
    setFilters(clearedFilters);
  };

  const stageColors = {
    "not contacted": "secondary",
    "no answer / gatekeeper": "secondary", 
    "decision maker": "warning",
    "nurturing": "secondary",
    "interested": "primary",
    "strategy call booked": "primary",
    "strategy call attended": "primary", 
    "proposal / scope": "success",
    "closed won": "success",
    "closed lost": "destructive"
  } as const;

  const priorityColors = {
    high: "destructive",
    medium: "warning", 
    low: "secondary"
  } as const;

  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        onClick={onToggle}
        className="relative"
      >
        <Filter className="h-4 w-4 mr-2" />
        Advanced Filters
        {activeFiltersCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {activeFiltersCount}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <Card className="mb-6 shadow-medium">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
            {activeFiltersCount > 0 && (
              <Badge variant="primary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Clear All
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Stages */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Deal Stages</Label>
          <div className="flex flex-wrap gap-2">
            {dealStages.map((stage) => (
              <Badge
                key={stage}
                variant={filters.stages.includes(stage) ? stageColors[stage as keyof typeof stageColors] : "outline"}
                className={cn(
                  "cursor-pointer transition-all hover:scale-105",
                  filters.stages.includes(stage) && "ring-2 ring-primary/20"
                )}
                onClick={() => toggleStage(stage)}
              >
                {stage}
              </Badge>
            ))}
          </div>
        </div>

        {/* Priorities */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Priority</Label>
          <div className="flex gap-2">
            {priorities.map((priority) => (
              <Badge
                key={priority}
                variant={filters.priorities.includes(priority) ? priorityColors[priority as keyof typeof priorityColors] : "outline"}
                className={cn(
                  "cursor-pointer transition-all hover:scale-105 capitalize",
                  filters.priorities.includes(priority) && "ring-2 ring-primary/20"
                )}
                onClick={() => togglePriority(priority)}
              >
                {priority}
              </Badge>
            ))}
          </div>
        </div>

        {/* Amount Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Deal Amount Range</Label>
          <div className="px-3">
            <Slider
              value={filters.amountRange}
              onValueChange={(value) => updateFilter('amountRange', value as [number, number])}
              max={1000000}
              min={0}
              step={1000}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>${filters.amountRange[0].toLocaleString()}</span>
              <span>${filters.amountRange[1].toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Close Date Range</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from ? format(filters.dateRange.from, "PPP") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.from}
                  onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, from: date })}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.to ? format(filters.dateRange.to, "PPP") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.to}
                  onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, to: date })}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Companies */}
        {companies.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Companies</Label>
            <Select onValueChange={(value) => {
              if (!filters.companies.includes(value)) {
                updateFilter('companies', [...filters.companies, value]);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select companies..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.companies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.companies.map((companyId) => {
                  const company = companies.find(c => c.id === companyId);
                  return (
                    <Badge key={companyId} variant="secondary" className="cursor-pointer">
                      {company?.name}
                      <X 
                        className="h-3 w-3 ml-1" 
                        onClick={() => updateFilter('companies', filters.companies.filter(c => c !== companyId))}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}