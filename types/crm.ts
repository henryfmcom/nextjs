export interface Lead {
  id: string;
  company_name: string;
  industry?: string;
  website?: string;
  contact_name: string;
  contact_title?: string;
  contact_email?: string;
  contact_phone?: string;
  source: {
    id: string;
    name: string;
  };
  current_stage: {
    id: string;
    name: string;
  };
  status: string;
  assigned_to?: {
    id: string;
    given_name: string;
    surname: string;
  };
  notes?: string;
  created_at: string;
  updated_at: string;
  is_converted: boolean;
  tenant_id: string;
} 