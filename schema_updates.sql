-- Lead Follow-ups table
CREATE TABLE public."LeadFollowUps" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES "Leads"(id),
  due_date TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'overdue')),
  description TEXT NOT NULL,
  assigned_to UUID NOT NULL REFERENCES "Employees"(id),
  completed_at TIMESTAMPTZ,
  tenant_id UUID NOT NULL REFERENCES "Tenants"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Conversions table
CREATE TABLE public."LeadConversions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES "Leads"(id),
  converted_at TIMESTAMPTZ NOT NULL,
  converted_by UUID NOT NULL REFERENCES "Employees"(id),
  deal_value DECIMAL(10,2),
  conversion_notes TEXT,
  tenant_id UUID NOT NULL REFERENCES "Tenants"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_lead_followups_lead_id ON "LeadFollowUps"(lead_id);
CREATE INDEX idx_lead_followups_assigned_to ON "LeadFollowUps"(assigned_to);
CREATE INDEX idx_lead_conversions_lead_id ON "LeadConversions"(lead_id); 