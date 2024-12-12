'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ProjectSelectorProps {
  selectedProjects: string[];
  onProjectsChange: (projects: string[]) => void;
}

export function ProjectSelector({ selectedProjects, onProjectsChange }: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedProjects.length > 0
            ? `${selectedProjects.length} projects selected`
            : "Select projects..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search projects..." />
          <CommandEmpty>No projects found.</CommandEmpty>
          <CommandGroup>
            {/* Map through available projects */}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}