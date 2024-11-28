## Core Features for Lead Management
### Lead Capture & Information Management
- Lead creation form with company and contact details
- Lead source tracking
- Lead status management
- Lead scoring system
- Lead assignment to sales representatives
### Lead Pipeline Management
- Customizable pipeline stages
Drag-and-drop stage management
Stage transition history
- Time-in-stage tracking
### Lead Activity Tracking
- Communication history (emails, calls, meetings)
- Task management
Follow-up reminders
- Document attachments
### Lead Conversion
- Lead to prospect conversion
- Prospect to client conversion
- Duplicate detection
- Conversion history

## Database Schema Updates
```
-- Lead Sources reference table
CREATE TABLE public."LeadSources" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT lead_sources_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id),
  CONSTRAINT unique_lead_source_name UNIQUE (name, tenant_id)
);

-- Lead Stages for pipeline management
CREATE TABLE public."LeadStages" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT lead_stages_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id),
  CONSTRAINT unique_stage_name UNIQUE (name, tenant_id),
  CONSTRAINT unique_stage_order UNIQUE (order_index, tenant_id)
);

-- Main Leads table
CREATE TABLE public."Leads" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  website VARCHAR(255),
  employee_count_range VARCHAR(50),
  annual_revenue_range VARCHAR(50),
  
  -- Primary Contact
  contact_name VARCHAR(255) NOT NULL,
  contact_title VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Lead Details
  source_id uuid NOT NULL,
  current_stage_id uuid NOT NULL,
  status VARCHAR(50) NOT NULL, -- new, contacted, qualified, unqualified
  score INTEGER DEFAULT 0,
  
  -- Assignment
  assigned_to uuid,
  last_contacted_at TIMESTAMPTZ,
  next_follow_up DATE,
  
  -- Additional Info
  notes TEXT,
  tags VARCHAR(255)[],
  
  -- System Fields
  is_converted BOOLEAN NOT NULL DEFAULT false,
  converted_to_client_id uuid,
  converted_at TIMESTAMPTZ,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT source_fk FOREIGN KEY (source_id) REFERENCES "LeadSources" (id),
  CONSTRAINT stage_fk FOREIGN KEY (current_stage_id) REFERENCES "LeadStages" (id),
  CONSTRAINT assigned_to_fk FOREIGN KEY (assigned_to) REFERENCES "Employees" (id),
  CONSTRAINT converted_to_client_fk FOREIGN KEY (converted_to_client_id) REFERENCES "Clients" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Lead Stage History
CREATE TABLE public."LeadStageHistory" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  from_stage_id uuid,
  to_stage_id uuid NOT NULL,
  changed_by uuid NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  time_in_previous_stage INTERVAL,
  notes TEXT,
  tenant_id uuid NOT NULL,
  
  CONSTRAINT lead_stage_history_pkey PRIMARY KEY (id),
  CONSTRAINT lead_fk FOREIGN KEY (lead_id) REFERENCES "Leads" (id),
  CONSTRAINT from_stage_fk FOREIGN KEY (from_stage_id) REFERENCES "LeadStages" (id),
  CONSTRAINT to_stage_fk FOREIGN KEY (to_stage_id) REFERENCES "LeadStages" (id),
  CONSTRAINT changed_by_fk FOREIGN KEY (changed_by) REFERENCES "Employees" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Lead Activities
CREATE TABLE public."LeadActivities" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  type VARCHAR(50) NOT NULL, -- email, call, meeting, note, task
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  activity_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  status VARCHAR(50), -- planned, completed, cancelled
  performed_by uuid NOT NULL,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT lead_activities_pkey PRIMARY KEY (id),
  CONSTRAINT lead_fk FOREIGN KEY (lead_id) REFERENCES "Leads" (id),
  CONSTRAINT performed_by_fk FOREIGN KEY (performed_by) REFERENCES "Employees" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Lead Documents
CREATE TABLE public."LeadDocuments" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by uuid NOT NULL,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT lead_documents_pkey PRIMARY KEY (id),
  CONSTRAINT lead_fk FOREIGN KEY (lead_id) REFERENCES "Leads" (id),
  CONSTRAINT uploaded_by_fk FOREIGN KEY (uploaded_by) REFERENCES "Employees" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Clients Table Updates
-- Add columns to track lead conversion
ALTER TABLE public."Clients"
ADD COLUMN converted_from_lead_id uuid,
ADD COLUMN conversion_date TIMESTAMPTZ,
ADD CONSTRAINT converted_from_lead_fk 
  FOREIGN KEY (converted_from_lead_id) 
  REFERENCES "Leads" (id);
```

## Implementation Phases
### Phase 1: Basic Lead Management
- Lead creation and basic information management
- Simple status tracking
- Basic assignment to employees
### Phase 2: Pipeline Management
- Implementation of stages
- Stage transition tracking
- Pipeline visualization
### Phase 3: Activity Tracking
- Activity logging
- Document management
- Follow-up system
### Phase 4: Conversion Process
- Lead to client conversion
- Conversion tracking
- Historical data maintenance

## API Endpoints
```
// Basic CRUD operations
GET    /api/leads
POST   /api/leads
GET    /api/leads/:id
PUT    /api/leads/:id
DELETE /api/leads/:id

// Pipeline management
GET    /api/leads/stages
PUT    /api/leads/:id/stage
GET    /api/leads/:id/stage-history

// Activities
GET    /api/leads/:id/activities
POST   /api/leads/:id/activities
PUT    /api/leads/:id/activities/:activityId

// Documents
GET    /api/leads/:id/documents
POST   /api/leads/:id/documents
DELETE /api/leads/:id/documents/:documentId

// Conversion
POST   /api/leads/:id/convert
```

## Key Components to Create
- Lead List View
```
export default function LeadsPage() {
  return (
    <div>
      <LeadFilters />
      <LeadList />
      <LeadPagination />
    </div>
  );
}
```

- Lead Pipeline View
```
export default function LeadPipelinePage() {
  return (
    <div>
      <PipelineStages />
      <DragDropLeadCards />
      <StageMetrics />
    </div>
  );
}
```

- Lead Detail View
```export default function LeadDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <LeadHeader />
      <LeadInformation />
      <LeadActivities />
      <LeadDocuments />
      <ConversionPanel />
    </div>
  );
}
```
