-- Positions
CREATE TABLE public."Positions" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  department_id uuid,
  level VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT positions_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id),
  CONSTRAINT department_fk FOREIGN KEY (department_id) REFERENCES "Departments" (id)
);

-- Contract Types
CREATE TABLE public."ContractTypes" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  payment_type VARCHAR(20) NOT NULL, -- monthly, hourly, one_time
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contract_types_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Employee Contracts
CREATE TABLE public."EmployeeContracts" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  contract_type_id uuid NOT NULL,
  position_id uuid NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  base_salary DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  working_hours INTEGER, -- weekly working hours
  overtime_rate DECIMAL(4,2), -- e.g., 1.5 for 150%
  weekend_rate DECIMAL(4,2),
  holiday_rate DECIMAL(4,2),
  probation_period INTEGER, -- in months
  notice_period INTEGER, -- in months
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employee_contracts_pkey PRIMARY KEY (id),
  CONSTRAINT employee_fk FOREIGN KEY (employee_id) REFERENCES "Employees" (id),
  CONSTRAINT contract_type_fk FOREIGN KEY (contract_type_id) REFERENCES "ContractTypes" (id),
  CONSTRAINT position_fk FOREIGN KEY (position_id) REFERENCES "Positions" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Contract Allowances
CREATE TABLE public."ContractAllowances" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  frequency VARCHAR(20) NOT NULL, -- monthly, yearly, one_time
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contract_allowances_pkey PRIMARY KEY (id),
  CONSTRAINT contract_fk FOREIGN KEY (contract_id) REFERENCES "EmployeeContracts" (id)
);

-- Payslips
CREATE TABLE public."Payslips" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary DECIMAL(12,2) NOT NULL,
  total_allowances DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_overtime DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_salary DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL, -- draft, approved, paid
  payment_date DATE,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payslips_pkey PRIMARY KEY (id),
  CONSTRAINT contract_fk FOREIGN KEY (contract_id) REFERENCES "EmployeeContracts" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Payslip Details
CREATE TABLE public."PayslipDetails" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payslip_id uuid NOT NULL,
  type VARCHAR(50) NOT NULL, -- base_salary, allowance, overtime, deduction
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payslip_details_pkey PRIMARY KEY (id),
  CONSTRAINT payslip_fk FOREIGN KEY (payslip_id) REFERENCES "Payslips" (id)
);

-- Work Schedule Types (for overtime calculations)
CREATE TABLE public."WorkScheduleTypes" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL, -- regular, weekend, holiday
  multiplier DECIMAL(4,2) NOT NULL, -- 1.0 for regular, 1.5 for overtime, 2.0 for holiday
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT work_schedule_types_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Public Holidays
CREATE TABLE public."PublicHolidays" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  name VARCHAR(100) NOT NULL,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT public_holidays_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Work Logs
CREATE TABLE public."WorkLogs" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  schedule_type_id uuid NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER NOT NULL DEFAULT 0, -- in minutes
  description TEXT,
  status VARCHAR(20) NOT NULL, -- pending, approved, rejected
  approved_by uuid,
  approved_at TIMESTAMPTZ,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT work_logs_pkey PRIMARY KEY (id),
  CONSTRAINT employee_fk FOREIGN KEY (employee_id) REFERENCES "Employees" (id),
  CONSTRAINT schedule_type_fk FOREIGN KEY (schedule_type_id) REFERENCES "WorkScheduleTypes" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Deduction Types
CREATE TABLE public."DeductionTypes" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  calculation_type VARCHAR(20) NOT NULL, -- fixed, percentage
  default_amount DECIMAL(12,2),
  default_percentage DECIMAL(5,2),
  is_tax BOOLEAN NOT NULL DEFAULT false,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT deduction_types_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Employee Loans
CREATE TABLE public."EmployeeLoans" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  remaining_amount DECIMAL(12,2) NOT NULL,
  monthly_deduction DECIMAL(12,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) NOT NULL, -- active, completed, cancelled
  description TEXT,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employee_loans_pkey PRIMARY KEY (id),
  CONSTRAINT employee_fk FOREIGN KEY (employee_id) REFERENCES "Employees" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Bonus Types
CREATE TABLE public."BonusTypes" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  calculation_type VARCHAR(20) NOT NULL, -- fixed, percentage, performance_based
  frequency VARCHAR(20) NOT NULL, -- monthly, quarterly, yearly, ad_hoc
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bonus_types_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Employee Bonuses
CREATE TABLE public."EmployeeBonuses" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  bonus_type_id uuid NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  status VARCHAR(20) NOT NULL, -- pending, approved, paid
  description TEXT,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employee_bonuses_pkey PRIMARY KEY (id),
  CONSTRAINT employee_fk FOREIGN KEY (employee_id) REFERENCES "Employees" (id),
  CONSTRAINT bonus_type_fk FOREIGN KEY (bonus_type_id) REFERENCES "BonusTypes" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Contract Amendments
CREATE TABLE public."ContractAmendments" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL,
  amendment_type VARCHAR(50) NOT NULL, -- salary_change, position_change, etc.
  effective_date DATE NOT NULL,
  previous_value JSONB NOT NULL,
  new_value JSONB NOT NULL,
  reason TEXT,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contract_amendments_pkey PRIMARY KEY (id),
  CONSTRAINT contract_fk FOREIGN KEY (contract_id) REFERENCES "EmployeeContracts" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Employee Benefits
CREATE TABLE public."EmployeeBenefits" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  benefit_type VARCHAR(50) NOT NULL, -- health_insurance, life_insurance, etc.
  provider VARCHAR(100),
  policy_number VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE,
  coverage_details JSONB,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employee_benefits_pkey PRIMARY KEY (id),
  CONSTRAINT employee_fk FOREIGN KEY (employee_id) REFERENCES "Employees" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Employee Tax Information
CREATE TABLE public."EmployeeTaxInfo" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  tax_id VARCHAR(50),
  tax_status VARCHAR(20), -- single, married, etc.
  allowances INTEGER,
  additional_withholding DECIMAL(12,2),
  effective_date DATE NOT NULL,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employee_tax_info_pkey PRIMARY KEY (id),
  CONSTRAINT employee_fk FOREIGN KEY (employee_id) REFERENCES "Employees" (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Shift Patterns
CREATE TABLE public."ShiftPatterns" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER NOT NULL, -- in minutes
  working_days INTEGER[], -- array of days (1-7)
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT shift_patterns_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

-- Payroll Audit Log
CREATE TABLE public."PayrollAuditLog" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- payslip, contract, allowance, etc.
  entity_id uuid NOT NULL,
  action VARCHAR(20) NOT NULL, -- created, updated, deleted
  changes JSONB NOT NULL,
  performed_by uuid NOT NULL,
  tenant_id uuid NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payroll_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_fk FOREIGN KEY (tenant_id) REFERENCES "Tenants" (id)
);

### Contract Management
Create/edit/terminate contracts
Contract type management
Allowance configuration
Overtime rates configuration
Contract history view
Contract renewal workflow

### Payroll Processing
Monthly payroll generation
Overtime calculation
Allowance calculation
Bulk payslip generation
Payslip approval workflow
Payment tracking

### Reporting
Payroll summary reports
Contract expiry reports
Cost center analysis
Salary history tracking
Tax reporting support

### Employee Portal
View current and past contracts
Access payslip history
Download payslips
View overtime records

### Work Time Management
Overtime request and approval workflow
Weekend work scheduling
Holiday work tracking
Work log reports
Automatic overtime calculation based on schedule type
Holiday calendar management

### Deductions Management
Tax configuration and calculation
Loan management
Loan application
Payment tracking
Automatic monthly deductions
Penalty management
Custom deduction types
Deduction reports

### Bonus Management
Multiple bonus types
Performance-based bonus calculation
Bonus approval workflow
Bonus payment scheduling
Bonus history tracking

### Enhanced Payroll Processing
Integration with work logs for overtime calculation
Automatic deduction processing
Bonus inclusion in payroll
Tax calculation
Loan payment processing

### Reporting and Analytics
Overtime analysis
Deduction summary
Bonus distribution reports
Tax reports
Loan status reports
Cost analysis by department/team

### Employee Self-Service
Submit overtime requests
View work logs
Track loan status
View bonus history
Access tax documents

### Approval Workflows
Overtime approval
Loan approval
Bonus approval
Work log verification