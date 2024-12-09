import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, X } from 'lucide-react';
import {
  Command,
  CommandInput,
  CommandItem,
  CommandGroup,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/utils/cn';
import { Label } from '@/components/ui/label';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSelect = useCallback((value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onChange(newSelected);
  }, [selected, onChange]);

  const filteredOptions = useMemo(() => {
    return options.filter(option => 
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [options, searchValue]);

  return (
    <div className="w-[200px]">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selected.length === 0 
              ? `All ${label}` 
              : `${selected.length} selected`}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-4 w-4 border rounded-sm flex items-center justify-center",
                      selected.includes(option.value) ? "bg-primary border-primary" : "border-input"
                    )}>
                      {selected.includes(option.value) && 
                        <Check className="h-3 w-3 text-primary-foreground" />
                      }
                    </div>
                    {option.label}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="flex flex-wrap gap-2 mt-2">
        {selected.map((value) => {
          const option = options.find(o => o.value === value);
          if (!option) return null;
          return (
            <Badge
              key={value}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {option.label}
              <button
                type="button"
                className="ml-1 hover:bg-muted rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(value);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
      </div>
    </div>
  );
} 