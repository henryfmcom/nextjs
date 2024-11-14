'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tenant } from './types';

interface TenantContextType {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  userTenants: Tenant[];
  setUserTenants: (tenants: Tenant[]) => void;
  isInitialized: boolean;
}

const defaultContext: TenantContextType = {
  currentTenant: null,
  setCurrentTenant: () => {},
  userTenants: [],
  setUserTenants: () => {},
  isInitialized: false,
};

const TenantContext = createContext<TenantContextType>(defaultContext);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentTenant, _setCurrentTenant] = useState<Tenant | null>(null);
  const [userTenants, _setUserTenants] = useState<Tenant[]>([]);

  // Memoized state setters
  const setCurrentTenant = useCallback((tenant: Tenant | null) => {
    _setCurrentTenant(tenant);
    if (tenant) {
      localStorage.setItem('currentTenant', JSON.stringify(tenant));
    } else {
      localStorage.removeItem('currentTenant');
    }
  }, []);

  const setUserTenants = useCallback((tenants: Tenant[]) => {
    _setUserTenants(tenants);
    localStorage.setItem('userTenants', JSON.stringify(tenants));

    // If no current tenant is selected and we have tenants, set the first one
    if ((!currentTenant || !tenants.some(t => t.id === currentTenant?.id)) && tenants.length > 0) {
      setCurrentTenant(tenants[0]);
    }
  }, [currentTenant, setCurrentTenant]);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return;

    try {
      // Load user tenants
      const savedUserTenants = localStorage.getItem('userTenants');
      if (savedUserTenants) {
        const parsedUserTenants = JSON.parse(savedUserTenants);
        _setUserTenants(parsedUserTenants);

        // Load current tenant
        const savedCurrentTenant = localStorage.getItem('currentTenant');
        if (savedCurrentTenant) {
          const parsedCurrentTenant = JSON.parse(savedCurrentTenant);
          if (parsedUserTenants.some((t: Tenant) => t.id === parsedCurrentTenant.id)) {
            _setCurrentTenant(parsedCurrentTenant);
          } else if (parsedUserTenants.length > 0) {
            _setCurrentTenant(parsedUserTenants[0]);
            localStorage.setItem('currentTenant', JSON.stringify(parsedUserTenants[0]));
          }
        } else if (parsedUserTenants.length > 0) {
          _setCurrentTenant(parsedUserTenants[0]);
          localStorage.setItem('currentTenant', JSON.stringify(parsedUserTenants[0]));
        }
      }
    } catch (error) {
      console.error('Error initializing tenant context:', error);
      _setUserTenants([]);
      _setCurrentTenant(null);
    } finally {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const value = {
    currentTenant,
    setCurrentTenant,
    userTenants,
    setUserTenants,
    isInitialized,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};