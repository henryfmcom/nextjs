# ZenSapo SaaS

A comprehensive resource management system built with Next.js and Supabase, featuring employee allocation tracking, project management, and skill tracking.

## Features

### Core Functionality
- 🔐 Authentication with Supabase
- 👥 Multi-tenant support
- 🌓 Light/Dark mode
- 📱 Responsive design

### Resource Management
1. **Employee Management**
   - Basic employee information
   - Department assignments
   - Knowledge tracking
   - Active/Inactive status
   - Contract management
   - Position tracking
   - Multiple contracts support with overlap detection

2. **Contract Management**
   - Employee contracts with positions
   - Contract types (Monthly, Hourly, etc.)
   - Salary and payment information
   - Contract period tracking
   - Rate configurations (Overtime, Weekend, Holiday)
   - Probation and notice periods

3. **Work Schedule Management**
   - Schedule type definitions
   - Rate multipliers for different schedules
   - Public holiday management
   - Bulk holiday import

4. **Work Log Management**
   - Daily work log tracking
   - Multiple date entry support
   - Break time tracking
   - Overtime calculation
   - Approval workflow
   - Bulk import capability

5. **Payroll Management**
   - Monthly payslip generation
   - Automatic overtime calculation
   - Allowances and deductions
   - Payment status tracking (Draft, Approved, Paid)
   - Work log integration

6. **Department Management**
   - Hierarchical department structure
   - Department-specific knowledge requirements
   - Employee assignments

7. **Client Management**
   - Client information tracking
   - Client code management
   - Address and location tracking

8. **Project Management**
   - Project details and status
   - Client association
   - Required knowledge
   - Project timeline tracking

9. **Knowledge/Skills Management**
   - Skill definition and tracking
   - Employee knowledge assignments
   - Project knowledge requirements

10. **Resource Allocation**
    - Employee project assignments
    - Allocation percentage tracking
    - Multiple view options:
      - List view with pagination
      - Calendar view with daily allocations
      - Heatmap view for workload visualization
    - Workload monitoring and overallocation detection

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Backend**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: React Context
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── account/           # Account management
│   ├── employees/         # Employee management
│   ├── departments/       # Department management
│   ├── clients/          # Client management
│   ├── projects/         # Project management
│   ├── allocations/      # Resource allocation
│   ├── contracts/        # Contract management
│   ├── work-logs/        # Work log tracking
│   ├── payslips/         # Payroll management
│   └── master/           # Master data management
├── components/
│   ├── landing/          # Landing page components
│   ├── layout/           # Layout components
│   ├── misc/             # Feature-specific components
│   └── ui/               # Reusable UI components
├── utils/
│   ├── supabase/         # Supabase utilities
│   └── types.ts          # TypeScript definitions
└── public/               # Static assets
```

## Getting Started

1. **Prerequisites**
   - Node.js 18+ installed
   - Supabase account
   - Git

2. **Clone and Setup**
   ```bash
   git clone https://github.com/phamvuhoang/nextjs-supabase-boilerplate.git
   cd nextjs-supabase-boilerplate
   npm install
   ```

3. **Supabase Setup**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Create `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Database Setup**
   - Go to Supabase SQL Editor
   - Copy contents of `schema.sql`
   - Run the SQL to create all tables
   - Initial tables:
     - Tenants
     - UserTenants
     - Employees
     - Departments
     - EmployeeDepartments
     - Clients
     - Projects
     - Knowledges
     - EmployeeKnowledges
     - ProjectKnowledges
     - Allocations

5. **User Setup for Login**
   - In the Supabase dashboard, navigate to the "Authentication" section.
   - Create a new **Auto-created User** with the following credentials:
     - Email: `admin@test.com`
     - Password: `Aa123456@`
   - **Add a Record to Tenants Table**:
     - Insert a new tenant record with the necessary details (e.g., name, subdomain, plan).
   - **Add a Record to UserTenants Table**:
     - Link the created user to the tenant by adding a record in the UserTenants table, associating the user ID with the tenant ID.

6. **Run Development Server**
   ```bash
   npm run dev
   ```

7. **Default Login**
   - Email: admin@test.com
   - Password: Aa123456@

## Database Schema

### Key Tables
1. **Tenants**: Multi-tenant support
   - id, name, subdomain, plan

2. **Employees**: Employee information
   - id, name, email, department, skills

3. **Departments**: Organizational structure
   - id, name, parent_department_id

4. **Projects**: Project tracking
   - id, name, client, status, timeline

5. **Allocations**: Resource assignments
   - id, employee_id, project_id, percentage

6. **Knowledges**: Skills tracking
   - id, title, description

See `schema.sql` for complete database structure.

## Environment Variables

Required environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.