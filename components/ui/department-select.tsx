'use client'

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from '@/utils/supabase/client';
import { getDepartments } from '@/utils/supabase/queries';
import { useTenant } from '@/utils/tenant-context';

interface Department {
  id: string;
  name: string;
  parent_department_id: string | null;
}

interface FormattedDepartment extends Department {
  level: number;
  displayName: string;
}

interface DepartmentSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function DepartmentSelect({ 
  value, 
  onValueChange, 
  placeholder = "Select a department",
  required = false 
}: DepartmentSelectProps) {
  const [departments, setDepartments] = useState<FormattedDepartment[]>([]);
  const { currentTenant } = useTenant();

  const formatDepartmentsHierarchy = (
    allDepartments: Department[],
    parentId: string | null = null,
    level: number = 0
  ): FormattedDepartment[] => {
    const result: FormattedDepartment[] = [];
    
    const depts = allDepartments.filter(d => d.parent_department_id === parentId);
    
    depts.forEach(dept => {
      const prefix = '—'.repeat(level);
      result.push({
        ...dept,
        level,
        displayName: level > 0 ? `${prefix} ${dept.name}` : dept.name
      });
      
      const children = formatDepartmentsHierarchy(allDepartments, dept.id, level + 1);
      result.push(...children);
    });
    
    return result;
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      if (!currentTenant) return;

      try {
        const supabase = createClient();
        const { departments: departmentsData } = await getDepartments(supabase, currentTenant.id);
        if (departmentsData) {
          const formattedDepts = formatDepartmentsHierarchy(departmentsData);
          setDepartments(formattedDepts);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    fetchDepartments();
  }, [currentTenant]);

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      required={required}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {departments.map((dept) => (
          <SelectItem 
            key={dept.id} 
            value={dept.id}
            className={dept.level > 0 ? 'ml-[' + (dept.level * 12) + 'px]' : ''}
          >
            {dept.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 