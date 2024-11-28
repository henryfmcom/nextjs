export interface Lead {
  id: string;
  company_name: string;
  industry?: string;
  website?: string;
  contact_name: string;
  contact_title?: string;
  contact_email?: string;
  contact_phone?: string;
  source?: {
    name: string;
  };
  current_stage?: {
    name: string;
  };
  status: string;
  assigned_to?: {
    given_name: string;
    surname: string;
  };
  notes?: string;
  created_at: string;
  tenant_id: string;
} 