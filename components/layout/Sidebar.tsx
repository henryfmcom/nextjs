'use client'

import { Button } from "@/components/ui/button";
import { Users, Briefcase, X, ChevronLeft, ChevronRight, Calendar, FolderTree, BookOpen, FileText, Network, List, Clock, ClipboardList, Database } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { useState } from 'react';

interface SidebarProps {
  onClose?: () => void;
}

const NAVIGATION_ITEMS = [
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
        title: "Departments",
        href: "/departments",
        icon: Network,
      },
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
    title: "Master",
    icon: Database,
    children: [
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
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleSection = (title: string) => {
    if (!isExpanded) {
      setIsExpanded(true);
      setExpandedSection(title);
    } else {
      setExpandedSection(expandedSection === title ? null : title);
    }
  };

  const isActiveLink = (href: string) => pathname.startsWith(href);

  return (
    <aside className={`bg-card shadow-md flex flex-col h-full transition-all duration-300 ${
      isExpanded ? 'w-64' : 'w-20'
    }`}>
      <div className="p-4">
        {/* Logo and Title */}
        <div className="mb-8 flex items-center justify-between">
          <Logo iconOnly={!isExpanded} />
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden lg:flex"
            >
              {isExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {NAVIGATION_ITEMS.map((item) => (
            <div key={item.title}>
              {item.children ? (
                // Parent item with children
                <div className="space-y-1">
                  <Button
                    variant={expandedSection === item.title ? "secondary" : "ghost"}
                    className={`w-full ${isExpanded ? 'justify-start' : 'justify-center'}`}
                    onClick={() => toggleSection(item.title)}
                    title={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    {isExpanded && <span className="ml-2">{item.title}</span>}
                  </Button>
                  {isExpanded && expandedSection === item.title && (
                    <div className="ml-4 space-y-1">
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href}>
                          <Button
                            variant={isActiveLink(child.href) ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            size="sm"
                          >
                            <child.icon className="h-4 w-4" />
                            <span className="ml-2">{child.title}</span>
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Single item
                <Link href={item.href}>
                  <Button
                    variant={isActiveLink(item.href) ? "secondary" : "ghost"}
                    className={`w-full ${isExpanded ? 'justify-start' : 'justify-center'}`}
                    title={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    {isExpanded && <span className="ml-2">{item.title}</span>}
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}