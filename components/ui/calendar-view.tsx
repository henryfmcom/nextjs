'use client';

import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  isWeekend
} from 'date-fns';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

// Constants for row limits
const CALENDAR_SINGLE_ROW_LIMIT = 3;
const CALENDAR_DOUBLE_ROW_LIMIT = 6;
const CALENDAR_MAX_CIRCLES = 10; // Maximum number of circles to show before "..."

interface Allocation {
  id: string;
  employee_name: string;
  project_name: string;
  Projects: {
    code: string;
    name: string;
  };
  start_date: string;
  end_date: string;
  allocation_percentage: number;
}

interface CalendarViewProps {
  allocations: Allocation[];
}

interface DayAllocation {
  employee_name: string;
  projects: {
    code: string;
    percentage: number;
  }[];
  total_percentage: number;
}

export function CalendarView({ allocations }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate days for the current month
  const days = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Add getMonthStartDays function
  const getMonthStartDays = (date: Date) => {
    const start = startOfMonth(date);
    const day = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const emptyDays = Array(day).fill(null);
    return emptyDays;
  };

  // Process allocations for each day
  const dailyAllocations = useMemo(() => {
    const result: Record<string, DayAllocation[]> = {};

    days.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayAllocations = new Map<string, DayAllocation>();

      allocations.forEach(allocation => {
        const startDate = new Date(allocation.start_date);
        const endDate = new Date(allocation.end_date);

        if (day >= startDate && day <= endDate) {
          if (!dayAllocations.has(allocation.employee_name)) {
            dayAllocations.set(allocation.employee_name, {
              employee_name: allocation.employee_name,
              projects: [],
              total_percentage: 0
            });
          }

          const employeeAllocation = dayAllocations.get(allocation.employee_name)!;
          employeeAllocation.projects.push({
            code: allocation.Projects.code,
            percentage: allocation.allocation_percentage
          });
          employeeAllocation.total_percentage += allocation.allocation_percentage;
        }
      });

      result[dateKey] = Array.from(dayAllocations.values())
        .sort((a, b) => a.employee_name.localeCompare(b.employee_name));
    });

    return result;
  }, [days, allocations]);

  const getAllocationColor = (percentage: number) => {
    if (percentage === 0) return 'bg-muted hover:bg-muted/80';
    if (percentage <= 50) return 'bg-green-200 hover:bg-green-300 dark:bg-green-900 dark:hover:bg-green-800 text-green-900 dark:text-green-100';
    if (percentage <= 80) return 'bg-yellow-200 hover:bg-yellow-300 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-900 dark:text-yellow-100';
    if (percentage <= 100) return 'bg-orange-200 hover:bg-orange-300 dark:bg-orange-900 dark:hover:bg-orange-800 text-orange-900 dark:text-orange-100';
    return 'bg-red-200 hover:bg-red-300 dark:bg-red-900 dark:hover:bg-red-800 text-red-900 dark:text-red-100';
  };

  const formatTooltip = (allocation: DayAllocation) => {
    const lines = [
      allocation.employee_name,
      `Total: ${allocation.total_percentage}%`,
      '',
      'Projects:',
      ...allocation.projects.map(p => `${p.code}: ${p.percentage}%`)
    ];
    return lines.join('\n');
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const renderAllocationCell = (allocation: DayAllocation) => {
    return (
      <div
        className={cn(
          "text-xs p-1 rounded cursor-pointer truncate",
          getAllocationColor(allocation.total_percentage)
        )}
        title={formatTooltip(allocation)}
      >
        {allocation.employee_name}
      </div>
    );
  };

  const renderAllocationCircle = (allocation: DayAllocation) => {
    return (
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs cursor-pointer",
          getAllocationColor(allocation.total_percentage)
        )}
        title={formatTooltip(allocation)}
      >
        {getInitials(allocation.employee_name)}
      </div>
    );
  };

  const renderDayAllocations = (date: Date, dayAllocations: DayAllocation[]) => {
    // Don't show allocations on weekends
    if (isWeekend(date)) {
      return (
        <div className="text-sm text-muted-foreground italic">
          Weekend
        </div>
      );
    }

    if (dayAllocations.length <= CALENDAR_SINGLE_ROW_LIMIT) {
      // Single row layout
      return (
        <div className="space-y-1">
          {dayAllocations.map((allocation) => (
            <div key={allocation.employee_name}>
              {renderAllocationCell(allocation)}
            </div>
          ))}
        </div>
      );
    }

    if (dayAllocations.length <= CALENDAR_DOUBLE_ROW_LIMIT) {
      // Double column layout
      return (
        <div className="grid grid-cols-2 gap-1">
          {dayAllocations.map((allocation) => (
            <div key={allocation.employee_name}>
              {renderAllocationCell(allocation)}
            </div>
          ))}
        </div>
      );
    }

    // Circle layout for many allocations
    const displayCount = Math.min(dayAllocations.length, CALENDAR_MAX_CIRCLES);
    const hasMore = dayAllocations.length > CALENDAR_MAX_CIRCLES;

    return (
      <div className="flex flex-wrap gap-1">
        {dayAllocations.slice(0, displayCount).map((allocation) => (
          <div key={allocation.employee_name}>
            {renderAllocationCircle(allocation)}
          </div>
        ))}
        {hasMore && (
          <div 
            className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs cursor-pointer"
            title={`${dayAllocations.length - CALENDAR_MAX_CIRCLES} more employees`}
          >
            ...
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
          <div 
            key={day} 
            className={cn(
              "text-center font-medium py-2",
              (index === 0 || index === 6) && "text-red-500"
            )}
          >
            {day}
          </div>
        ))}

        {/* Add empty cells for days before the first of the month */}
        {getMonthStartDays(currentDate).map((_, index) => (
          <div key={`empty-${index}`} className="min-h-[120px] bg-muted/50" />
        ))}

        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayAllocations = dailyAllocations[dateKey] || [];

          return (
            <div
              key={dateKey}
              className={cn(
                "min-h-[120px] p-1 border rounded-md",
                !isSameMonth(day, currentDate) && "bg-muted/50",
                isToday(day) && "border-primary",
                isWeekend(day) && "bg-gray-100 dark:bg-gray-800/50",
                "dark:border-zinc-700"
              )}
            >
              <div className={cn(
                "text-right text-sm mb-1",
                isWeekend(day) && "text-red-500"
              )}>
                {format(day, 'd')}
              </div>
              {/* Don't show allocations on weekends */}
              {isWeekend(day) ? (
                <div className="text-sm text-muted-foreground italic">
                  Weekend
                </div>
              ) : (
                renderDayAllocations(day, dayAllocations)
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-4 h-4 rounded",
            "bg-green-200 dark:bg-green-900"
          )}></div>
          <span>≤ 50%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-4 h-4 rounded",
            "bg-yellow-200 dark:bg-yellow-900"
          )}></div>
          <span>51-80%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-4 h-4 rounded",
            "bg-orange-200 dark:bg-orange-900"
          )}></div>
          <span>81-100%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-4 h-4 rounded",
            "bg-red-200 dark:bg-red-900"
          )}></div>
          <span>&gt; 100%</span>
        </div>
      </div>
    </div>
  );
} 