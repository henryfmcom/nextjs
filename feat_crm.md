## Core CRM Features

A. Lead Management Pipeline
- Lead capture and tracking
- Lead qualification process
- Lead to prospect to client conversion
- Pipeline stage management
- Activity tracking (calls, emails, meetings)
B. Sales & Proposal Management
- Project proposal creation and tracking
- Estimation management
- Quote generation
- Sales opportunity tracking
- Win/loss analysis
C. Financial Management
Invoice generation and tracking
- Payment tracking
- Revenue forecasting
- Project budgeting
- Recurring revenue tracking
D. Client Engagement
- Client communication history
- Meeting schedules
- Document sharing
- Client feedback tracking
- Service level agreements (SLAs)

## Database Schema Additions
Here's the suggested schema additions to support these features:

```
-- Lead Management
CREATE TABLE public."Leads" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- new, qualified, converted, lost
  source VARCHAR(100) NOT NULL, -- website, referral, cold-call, etc.
  industry VARCHAR(100),
  estimated_value DECIMAL(12,2),
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),
  assigned_to uuid, -- reference to Employees
  next_follow_up DATE,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id),
  CONSTRAINT assigned_to_fk FOREIGN KEY (assigned_to) REFERENCES "Employees" (id)
);

-- Sales Opportunities
CREATE TABLE public."Opportunities" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid,
  client_id uuid,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- prospecting, negotiation, won, lost
  stage VARCHAR(50) NOT NULL, -- initial, proposal, negotiation, closing
  expected_revenue DECIMAL(12,2),
  probability INTEGER, -- 0-100
  expected_close_date DATE,
  actual_close_date DATE,
  assigned_to uuid,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT opportunities_pkey PRIMARY KEY (id),
  CONSTRAINT lead_fk FOREIGN KEY (lead_id) REFERENCES "Leads" (id),
  CONSTRAINT client_fk FOREIGN KEY (client_id) REFERENCES "Clients" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Proposals
CREATE TABLE public."Proposals" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL, -- draft, sent, accepted, rejected
  total_amount DECIMAL(12,2) NOT NULL,
  valid_until DATE,
  sent_date DATE,
  accepted_date DATE,
  rejection_reason TEXT,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT proposals_pkey PRIMARY KEY (id),
  CONSTRAINT opportunity_fk FOREIGN KEY (opportunity_id) REFERENCES "Opportunities" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Invoices
CREATE TABLE public."Invoices" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  invoice_number VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL, -- draft, sent, paid, overdue
  amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT project_fk FOREIGN KEY (project_id) REFERENCES "Projects" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Client Interactions
CREATE TABLE public."ClientInteractions" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid,
  lead_id uuid,
  type VARCHAR(50) NOT NULL, -- email, call, meeting, note
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  interaction_date TIMESTAMPTZ NOT NULL,
  employee_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT client_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT client_fk FOREIGN KEY (client_id) REFERENCES "Clients" (id),
  CONSTRAINT lead_fk FOREIGN KEY (lead_id) REFERENCES "Leads" (id),
  CONSTRAINT employee_fk FOREIGN KEY (employee_id) REFERENCES "Employees" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Documents
CREATE TABLE public."Documents" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- proposal, contract, invoice, other
  status VARCHAR(50) NOT NULL, -- draft, final, signed
  url VARCHAR(500) NOT NULL,
  client_id uuid,
  lead_id uuid,
  project_id uuid,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT client_fk FOREIGN KEY (client_id) REFERENCES "Clients" (id),
  CONSTRAINT lead_fk FOREIGN KEY (lead_id) REFERENCES "Leads" (id),
  CONSTRAINT project_fk FOREIGN KEY (project_id) REFERENCES "Projects" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);
```

## Integration with Existing Features
### Client Management Integration
- Extend existing Clients table with additional CRM-specific fields
- Link leads to clients for conversion tracking
- Connect projects with opportunities and proposals
### Project Management Integration
- Link projects to proposals and opportunities
- Connect project timelines with invoice schedules
### Employee Integration
- Assign sales responsibilities to employees
- Track sales performance and commissions
- Link employee activities with client interactions
### Reporting Integration
- Sales pipeline analytics
- Revenue forecasting
- Client engagement metrics
- Project profitability analysis

## Suggested Implementation Order
- Lead Management System
- Opportunity & Pipeline Management
- Proposal & Document Management
- Invoice & Financial Management
- Client Interaction Tracking
- Reporting & Analytics
