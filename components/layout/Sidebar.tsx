'use client'

import { Button } from "@/components/ui/button";
import { Users, Briefcase, X, ChevronLeft, ChevronRight, Calendar, FolderTree, BookOpen, FileText, Network, List, Clock, ClipboardList, Database } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { useState, useEffect, useMemo } from 'react';

interface NavItem {
  title: string;
  href?: string;
  icon: any;
  children?: NavItem[];
}

interface SidebarProps {
  onClose?: () => void;
}

const NAVIGATION_ITEMS: NavItem[] = [
  {
    title: "Allocations",
    href: "/allocations",
    icon: Calendar,
  },
  {
    title: "Projects",
    href: "/projects",
    icon: Briefcase,
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    title: "HR",
    icon: Users,
    children: [
      {
        title: "Employees",
        href: "/employees",
        icon: Users,
      },
      {
        title: "Employee Contracts",
        href: "/contracts",
        icon: FileText,
      },
      {
        title: "Work Logs",
        href: "/work-logs",
        icon: ClipboardList,
      },
      {
        title: "Payslips",
        href: "/payslips",
        icon: FileText,
      },
    ]
  },
  {
    title: "CRM",
    icon: Users,
    children: [
      {
        title: "Leads",
        href: "/leads",
        icon: Network,
      },
      {
        title: "Opportunities",
        href: "/opportunities",
        icon: Briefcase,
      },
    ]
  },
  {
    title: "Master",
    icon: Database,
    children: [
      {
        title: "Departments",
        href: "/departments",
        icon: Network,
      },
      {
        title: "Contract Types",
        href: "/master/contract-types",
        icon: FileText,
      },
      {
        title: "Work Schedules",
        href: "/master/schedules",
        icon: Clock,
      },
      {
        title: "Public Holidays",
        href: "/master/holidays",
        icon: Calendar,
      },
      {
        title: "Positions",
        href: "/master/positions",
        icon: Briefcase,
      },
      {
        title: "Knowledge",
        href: "/master/knowledge",
        icon: BookOpen,
      },
    ]
  },
];

export function Sidebar({ onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();

  // Find which parent item should be expanded based on current path
  const activeParent = useMemo(() => {
    return NAVIGATION_ITEMS.find(item => 
      item.children?.some(child => child.href === pathname)
    )?.title;
  }, [pathname]);

  // Update expanded items when route changes
  useEffect(() => {
    if (activeParent) {
      setExpandedItems([activeParent]);
    }
  }, [activeParent]);

  const toggleItem = (title: string) => {
    if (collapsed) {
      // If sidebar is collapsed, expand it when clicking a parent item
      setCollapsed(false);
      setExpandedItems([title]);
      return;
    }

    if (expandedItems.includes(title)) {
      // Don't collapse if this is the active parent
      if (title === activeParent) return;
      setExpandedItems(expandedItems.filter(item => item !== title));
    } else {
      // Collapse others and expand this one
      setExpandedItems([title]);
    }
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = item.href === pathname;
    const isExpanded = expandedItems.includes(item.title);
    const Icon = item.icon;
    const hasActiveChild = item.children?.some(child => child.href === pathname);

    if (item.children) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleItem(item.title)}
            className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-accent/50 ${
              (isExpanded || hasActiveChild) ? 'bg-accent/80 text-accent-foreground' : ''
            }`}
            title={collapsed ? `${item.title} (Click to expand)` : undefined}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon className={`h-4 w-4 flex-shrink-0 ${
                hasActiveChild ? 'text-primary' : ''
              }`} />
              {!collapsed && (
                <span className="truncate">{item.title}</span>
              )}
            </div>
            {!collapsed && (
              <ChevronRight className={`h-4 w-4 flex-shrink-0 transition-transform ${
                isExpanded ? 'transform rotate-90' : ''
              }`} />
            )}
          </button>
          {isExpanded && !collapsed && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 pl-2">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href || '#'}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-accent/50 ${
                    child.href === pathname ? 'bg-accent text-accent-foreground' : ''
                  }`}
                  title={collapsed ? child.title : undefined}
                >
                  <child.icon className={`h-4 w-4 flex-shrink-0 ${
                    child.href === pathname ? 'text-primary' : ''
                  }`} />
                  {!collapsed && (
                    <span className="truncate">{child.title}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href || '#'}
        className={`flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-accent/50 ${
          isActive ? 'bg-accent text-accent-foreground' : ''
        }`}
        title={collapsed ? item.title : undefined}
      >
        <Icon className={`h-4 w-4 flex-shrink-0 ${
          isActive ? 'text-primary' : ''
        }`} />
        {!collapsed && (
          <span className="truncate">{item.title}</span>
        )}
      </Link>
    );
  };

  return (
    <div className={`relative flex flex-col h-screen border-r bg-card transition-all duration-300 ${
      collapsed ? 'w-[52px]' : 'w-[240px]'
    }`}>
      <div className="p-2 flex flex-col h-full">
        {/* Logo and Title */}
        <div className="mb-6 flex items-center justify-between px-2">
          <Logo iconOnly={collapsed} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-8 w-8"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto space-y-2 -mr-2 pr-2">
          {NAVIGATION_ITEMS.map(renderNavItem)}
        </div>
      </div>
    </div>
  );
}