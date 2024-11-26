import { SupabaseClient } from '@supabase/supabase-js';

export const getUser = async (supabase: SupabaseClient) => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
};

export async function getEmployees(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number
) {
  let query = supabase
    .from('Employees')
    .select(`
      *,
      departments:EmployeeDepartments(
        department:Departments(*)
      )
    `, { count: 'exact' })
    .eq('is_deleted', false)
    .eq('tenant_id', tenantId)
    .order('surname', { ascending: true });

  if (page !== undefined && itemsPerPage !== undefined) {
    const startRow = (page - 1) * itemsPerPage;
    query = query.range(startRow, startRow + itemsPerPage - 1);
  }

  const { data: employees, error, count } = await query;

  if (error) {
    console.error('Error fetching employees:', error);
    return { employees: null, count: 0 };
  }

  return { employees, count };
}

export async function getEmployee(supabase: SupabaseClient, id: string) {
  const { data: employee, error } = await supabase
    .from('Employees')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error) {
    console.error('Error fetching employee:', error);
    return null;
  }

  return employee;
}

export async function addEmployee(supabase: SupabaseClient, employeeData: any) {
  const { data, error } = await supabase
    .from('Employees')
    .insert([{
      ...employeeData,
      is_deleted: false
    }])
    .select();

  if (error) {
    console.error('Error adding employee:', error);
    throw error;
  }

  return data;
}

export async function updateEmployee(supabase: SupabaseClient, employeeData: any) {
  const { data, error } = await supabase
    .from('Employees')
    .update([{
      ...employeeData,
      updated_at: new Date().toISOString()
    }])
    .eq('id', employeeData.id)
    .select();

  if (error) {
    console.error('Error updating employee:', error);
    throw error;
  }

  return data;
}

export async function getClients(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number
) {
  let query = supabase
    .from('Clients')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });

  if (page !== undefined && itemsPerPage !== undefined) {
    const startRow = (page - 1) * itemsPerPage;
    query = query.range(startRow, startRow + itemsPerPage - 1);
  }

  const { data: clients, error, count } = await query;

  if (error) {
    console.error('Error fetching clients:', error);
    return { clients: null, count: 0 };
  }

  return { clients, count };
}

export async function getClient(supabase: SupabaseClient, id: string) {
  const { data: client, error } = await supabase
    .from('Clients')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    return null;
  }

  return client;
}

export async function addClient(supabase: SupabaseClient, clientData: any) {
  const { data, error } = await supabase
    .from('Clients')
    .insert([clientData])
    .select();

  if (error) {
    console.error('Error adding client:', error);
    throw error;
  }

  return data;
}

export async function updateClient(supabase: SupabaseClient, clientData: any) {
  const { data, error } = await supabase
    .from('Clients')
    .update([clientData])
    .eq('id', clientData.id)
    .select();

  if (error) {
    console.error('Error updating client:', error);
    throw error;
  }

  return data;
}

export async function getProjects(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number
) {
  let query = supabase
    .from('Projects')
    .select('*, Clients(name)', { count: 'exact' })
    // .eq('is_deleted', false)
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });

  if (page !== undefined && itemsPerPage !== undefined) {
    const startRow = (page - 1) * itemsPerPage;
    query = query.range(startRow, startRow + itemsPerPage - 1);
  }

  const { data: projects, error, count } = await query;

  if (error) {
    console.error('Error fetching projects:', error);
    return { projects: null, count: 0 };
  }

  const projectsWithClientName = projects?.map((project) => ({ 
    ...project,
    client_name: project.Clients ? project.Clients.name : 'Unknown Client',
  }));

  return { projects: projectsWithClientName, count };
}

export async function getProject(supabase: SupabaseClient, id: string) {
  const { data: project, error } = await supabase
    .from('Projects')
    .select('*')
    .eq('id', id)
    // .eq('is_deleted', false)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }

  return project;
}
    
export async function addProject(supabase: SupabaseClient, projectData: any) {
  const { data, error } = await supabase
    .from('Projects')
    .insert([projectData])
    .select();

  if (error) {
    console.error('Error adding project:', error);
    throw error;
  }

  return data;
}

export async function updateProject(supabase: SupabaseClient, projectData: any) {
  const { data, error } = await supabase
    .from('Projects')
    .update([projectData])
    .eq('id', projectData.id)
    .select();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  return data;
}

// Add a new function specifically for searching clients
export async function searchClients(
  supabase: SupabaseClient,
  searchTerm: string
) {
  const { data: clients, error } = await supabase
    .from('Clients')
    .select('*')
    .eq('is_deleted', false)
    .ilike('name', `%${searchTerm}%`)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error searching clients:', error);
    return null;
  }

  return clients;
}

export async function getAllocations(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number
) {
  let query = supabase
    .from('Allocations')
    .select(`
      *,
      Employees(given_name, surname),
      Projects(name, code)
    `, { count: 'exact' })
    .eq('is_deleted', false)
    .eq('tenant_id', tenantId)
    .order('start_date', { ascending: false });

  if (page !== undefined && itemsPerPage !== undefined) {
    const startRow = (page - 1) * itemsPerPage;
    query = query.range(startRow, startRow + itemsPerPage - 1);
  }

  const { data: allocations, error, count } = await query;

  if (error) {
    console.error('Error fetching allocations:', error);
    return { allocations: null, count: 0 };
  }

  const formattedAllocations = allocations?.map(allocation => ({
    ...allocation,
    employee_name: `${allocation.Employees.given_name} ${allocation.Employees.surname}`,
    project_name: `${allocation.Projects.code} - ${allocation.Projects.name}`
  }));

  return { allocations: formattedAllocations, count };
}

export async function getAllocation(supabase: SupabaseClient, id: string) {
  // First, get the basic allocation data
  const { data: allocation, error: allocationError } = await supabase
    .from('Allocations')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (allocationError) {
    console.error('Error fetching allocation:', allocationError);
    return null;
  }

  // Then get the employee and project details separately
  const { data: employee } = await supabase
    .from('Employees')
    .select('given_name, surname')
    .eq('id', allocation.employee_id)
    .single();

  const { data: project } = await supabase
    .from('Projects')
    .select('name, code')
    .eq('id', allocation.project_id)
    .single();

  return {
    ...allocation,
    Employees: employee,
    Projects: project
  };
}

export async function addAllocation(supabase: SupabaseClient, allocationData: any) {
  const { data, error } = await supabase
    .from('Allocations')
    .insert([{
      ...allocationData,
      is_deleted: false
    }])
    .select();

  if (error) {
    console.error('Error adding allocation:', error);
    throw error;
  }

  return data;
}

export async function updateAllocation(supabase: SupabaseClient, allocationData: any) {
  // Remove nested objects before update
  const { Employees, Projects, employee_name, project_name, ...updateData } = allocationData;
  
  const { data, error } = await supabase
    .from('Allocations')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', updateData.id)
    .select();

  if (error) {
    console.error('Error updating allocation:', error);
    throw error;
  }

  return data;
}

export async function getUserTenants(supabase: SupabaseClient, userId: string) {
  const { data: userTenants, error } = await supabase
    .from('UserTenants')
    .select(`
      *,
      tenant:Tenants(*)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user tenants:', error);
    return null;
  }

  return userTenants;
}

export async function getDepartments(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number
) {
  let query = supabase
    .from('Departments')
    .select(`
      *,
      parent_department:parent_department_id(*)
    `, { count: 'exact' })
    .eq('is_deleted', false)
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });

  if (page !== undefined && itemsPerPage !== undefined) {
    const startRow = (page - 1) * itemsPerPage;
    query = query.range(startRow, startRow + itemsPerPage - 1);
  }

  const { data: departments, error, count } = await query;

  if (error) {
    console.error('Error fetching departments:', error);
    return { departments: null, count: 0 };
  }

  return { departments, count };
}

export async function getDepartment(supabase: SupabaseClient, id: string) {
  const { data: department, error } = await supabase
    .from('Departments')
    .select(`
      *,
      parent_department:parent_department_id(*)
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error) {
    console.error('Error fetching department:', error);
    return null;
  }

  return department;
}

export async function addDepartment(supabase: SupabaseClient, departmentData: any) {
  const { data, error } = await supabase
    .from('Departments')
    .insert([{
      ...departmentData,
      is_deleted: false
    }])
    .select();

  if (error) {
    console.error('Error adding department:', error);
    throw error;
  }

  return data;
}

export async function updateDepartment(supabase: SupabaseClient, departmentData: any) {
  const { id, parent_department, ...updateData } = departmentData;
  
  const { data, error } = await supabase
    .from('Departments')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating department:', error);
    throw error;
  }

  return data;
}

export async function addEmployeeDepartments(
  supabase: SupabaseClient, 
  employeeId: string, 
  departmentIds: string[]
) {
  const { error } = await supabase
    .from('EmployeeDepartments')
    .upsert(
      departmentIds.map(departmentId => ({
        employee_id: employeeId,
        department_id: departmentId,
        assigned_at: new Date().toISOString()
      }))
    );

  if (error) {
    console.error('Error adding employee departments:', error);
    throw error;
  }
}

export async function removeEmployeeDepartments(
  supabase: SupabaseClient, 
  employeeId: string
) {
  const { error } = await supabase
    .from('EmployeeDepartments')
    .delete()
    .eq('employee_id', employeeId);

  if (error) {
    console.error('Error removing employee departments:', error);
    throw error;
  }
}

export async function getKnowledges(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number
) {
  let query = supabase
    .from('Knowledges')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .eq('tenant_id', tenantId)
    .order('title', { ascending: true });

  if (page !== undefined && itemsPerPage !== undefined) {
    const startRow = (page - 1) * itemsPerPage;
    query = query.range(startRow, startRow + itemsPerPage - 1);
  }

  const { data: knowledges, error, count } = await query;

  if (error) {
    console.error('Error fetching knowledges:', error);
    return { knowledges: null, count: 0 };
  }

  return { knowledges, count };
}

export async function getKnowledge(supabase: SupabaseClient, id: string) {
  const { data: knowledge, error } = await supabase
    .from('Knowledges')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error) {
    console.error('Error fetching knowledge:', error);
    return null;
  }

  return knowledge;
}

export async function addKnowledge(supabase: SupabaseClient, knowledgeData: any) {
  const { data, error } = await supabase
    .from('Knowledges')
    .insert([{
      ...knowledgeData,
      is_deleted: false
    }])
    .select();

  if (error) {
    console.error('Error adding knowledge:', error);
    throw error;
  }

  return data;
}

export async function updateKnowledge(supabase: SupabaseClient, knowledgeData: any) {
  const { id, ...updateData } = knowledgeData;
  
  const { data, error } = await supabase
    .from('Knowledges')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating knowledge:', error);
    throw error;
  }

  return data;
}

export async function getEmployeeKnowledge(
  supabase: SupabaseClient,
  employeeId: string
) {
  const { data, error } = await supabase
    .from('EmployeeKnowledges')
    .select(`
      *,
      knowledge:Knowledges(*)
    `)
    .eq('employee_id', employeeId);

  if (error) {
    console.error('Error fetching employee knowledges:', error);
    return null;
  }

  return data;
}

export async function addEmployeeKnowledge(
  supabase: SupabaseClient,
  employeeId: string,
  knowledgeIds: string[]
) {
  const { error } = await supabase
    .from('EmployeeKnowledges')
    .insert(
      knowledgeIds.map(knowledgeId => ({
        employee_id: employeeId,
        knowledge_id: knowledgeId,
        acquired_at: new Date().toISOString()
      }))
    );

  if (error) {
    console.error('Error adding employee knowledge:', error);
    throw error;
  }
}

export async function removeEmployeeKnowledge(
  supabase: SupabaseClient,
  employeeId: string,
) {
  const { error } = await supabase
    .from('EmployeeKnowledges')
    .delete()
    .eq('employee_id', employeeId);

  if (error) {
    console.error('Error removing employee knowledge:', error);
    throw error;
  }
}

export async function getProjectKnowledges(
  supabase: SupabaseClient,
  projectId: string
) {
  const { data, error } = await supabase
    .from('ProjectKnowledges')
    .select(`
      *,
      knowledge:Knowledges(*)
    `)
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching project knowledges:', error);
    return null;
  }

  return data;
}

export async function addProjectKnowledge(
  supabase: SupabaseClient,
  projectId: string,
  knowledgeIds: string[]
) {
  const { error } = await supabase
    .from('ProjectKnowledges')
    .insert(
      knowledgeIds.map(knowledgeId => ({
        project_id: projectId,
        knowledge_id: knowledgeId,
        assigned_at: new Date().toISOString()
      }))
    );

  if (error) {
    console.error('Error adding project knowledge:', error);
    throw error;
  }
}

export async function removeProjectKnowledge(
  supabase: SupabaseClient,
  projectId: string,
) {
  const { error } = await supabase
    .from('ProjectKnowledges')
    .delete()
    .eq('project_id', projectId);

  if (error) {
    console.error('Error removing project knowledge:', error);
    throw error;
  }
}

export async function getEmployeeSuggestions(
  supabase: SupabaseClient,
  tenantId: string,
  selectedKnowledges: string[]
) {
  if (!selectedKnowledges.length) return [];

  const { data: employees, error } = await supabase
    .from('Employees')
    .select(`
      id,
      given_name,
      surname,
      EmployeeKnowledges!inner (
        knowledge_id
      ),
      Allocations (
        allocation_percentage,
        start_date,
        end_date
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .in('EmployeeKnowledges.knowledge_id', selectedKnowledges);

  if (error) {
    console.error('Error fetching employee suggestions:', error);
    throw error;
  }

  return employees || [];
}

export async function getPositions(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number
) {
  try {
    let query = supabase
      .from('Positions')
      .select(`
        *,
        department:Departments(name)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (page && itemsPerPage) {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Transform the data to match the Position interface
    const positions = data.map(position => ({
      id: position.id,
      title: position.title,
      department_id: position.department_id,
      department_name: position.department?.name,
      level: position.level,
      is_active: position.is_active
    }));

    return { positions, count };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getPosition(
  supabase: SupabaseClient,
  positionId: string
) {
  try {
    const { data, error } = await supabase
      .from('Positions')
      .select(`
        *,
        department:Departments(id, name)
      `)
      .eq('id', positionId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function addPosition(
  supabase: SupabaseClient,
  positionData: any
) {
  try {
    const { data, error } = await supabase
      .from('Positions')
      .insert([positionData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function updatePosition(
  supabase: SupabaseClient,
  positionData: any
) {
  try {
    const { data, error } = await supabase
      .from('Positions')
      .update(positionData)
      .eq('id', positionData.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getContractTypes(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number
) {
  try {
    let query = supabase
      .from('ContractTypes')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (page && itemsPerPage) {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return { contractTypes: data, count };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getContractType(
  supabase: SupabaseClient,
  contractTypeId: string
) {
  try {
    const { data, error } = await supabase
      .from('ContractTypes')
      .select('*')
      .eq('id', contractTypeId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function addContractType(
  supabase: SupabaseClient,
  contractTypeData: any
) {
  try {
    const { data, error } = await supabase
      .from('ContractTypes')
      .insert([contractTypeData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function updateContractType(
  supabase: SupabaseClient,
  contractTypeData: any
) {
  try {
    const { data, error } = await supabase
      .from('ContractTypes')
      .update(contractTypeData)
      .eq('id', contractTypeData.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getEmployeeContracts(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number,
  employeeId?: string
) {
  try {
    let query = supabase
      .from('EmployeeContracts')
      .select(`
        *,
        employee:Employees(given_name, surname),
        position:Positions(title),
        contract_type:ContractTypes(name)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    query = query.order('start_date', { ascending: false });

    if (page && itemsPerPage) {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const contracts = data.map(contract => ({
      ...contract,
      employee_name: `${contract.employee.given_name} ${contract.employee.surname}`,
      position_title: contract.position.title,
      contract_type_name: contract.contract_type.name
    }));

    return { contracts, count };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getEmployeeContract(
  supabase: SupabaseClient,
  contractId: string
) {
  try {
    const { data, error } = await supabase
      .from('EmployeeContracts')
      .select(`
        *,
        employee:Employees(id, given_name, surname),
        position:Positions(id, title),
        contract_type:ContractTypes(id, name)
      `)
      .eq('id', contractId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function addEmployeeContract(
  supabase: SupabaseClient,
  contractData: any
) {
  try {
    const { data, error } = await supabase
      .from('EmployeeContracts')
      .insert([contractData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function updateEmployeeContract(
  supabase: SupabaseClient,
  contractData: any
) {
  try {
    const { data, error } = await supabase
      .from('EmployeeContracts')
      .update(contractData)
      .eq('id', contractData.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getPublicHolidays(
  supabase: SupabaseClient,
  tenantId: string,
  year?: number,
  page?: number,
  itemsPerPage?: number
) {
  try {
    let query = supabase
      .from('PublicHolidays')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('date', { ascending: true });

    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }

    if (page && itemsPerPage) {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return { holidays: data, count };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getPublicHoliday(
  supabase: SupabaseClient,
  holidayId: string
) {
  try {
    const { data, error } = await supabase
      .from('PublicHolidays')
      .select('*')
      .eq('id', holidayId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function addPublicHoliday(
  supabase: SupabaseClient,
  holidayData: any
) {
  try {
    const { data, error } = await supabase
      .from('PublicHolidays')
      .insert([holidayData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function updatePublicHoliday(
  supabase: SupabaseClient,
  holidayData: any
) {
  try {
    const { data, error } = await supabase
      .from('PublicHolidays')
      .update(holidayData)
      .eq('id', holidayData.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function bulkAddPublicHolidays(
  supabase: SupabaseClient,
  holidays: any[]
) {
  try {
    const { data, error } = await supabase
      .from('PublicHolidays')
      .insert(holidays)
      .select();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getWorkScheduleTypes(
  supabase: SupabaseClient,
  tenantId: string,
  page?: number,
  itemsPerPage?: number
) {
  try {
    let query = supabase
      .from('WorkScheduleTypes')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (page && itemsPerPage) {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return { scheduleTypes: data, count };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getWorkScheduleType(
  supabase: SupabaseClient,
  scheduleTypeId: string
) {
  try {
    const { data, error } = await supabase
      .from('WorkScheduleTypes')
      .select('*')
      .eq('id', scheduleTypeId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function addWorkScheduleType(
  supabase: SupabaseClient,
  scheduleTypeData: any
) {
  try {
    const { data, error } = await supabase
      .from('WorkScheduleTypes')
      .insert([scheduleTypeData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function updateWorkScheduleType(
  supabase: SupabaseClient,
  scheduleTypeData: any
) {
  try {
    const { data, error } = await supabase
      .from('WorkScheduleTypes')
      .update(scheduleTypeData)
      .eq('id', scheduleTypeData.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getWorkLogs(
  supabase: SupabaseClient,
  tenantId: string,
  employeeId?: string,
  startDate?: string,
  endDate?: string,
  page?: number,
  itemsPerPage?: number
) {
  try {
    let query = supabase
      .from('WorkLogs')
      .select(`
        *,
        employee:Employees(given_name, surname),
        schedule_type:WorkScheduleTypes(name, multiplier),
        approver:Employees(given_name, surname)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false });

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    if (page && itemsPerPage) {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const workLogs = data.map(log => ({
      ...log,
      employee_name: `${log.employee.given_name} ${log.employee.surname}`,
      schedule_type_name: log.schedule_type.name,
      schedule_type_multiplier: log.schedule_type.multiplier,
      approver_name: log.approver ? `${log.approver.given_name} ${log.approver.surname}` : null
    }));

    return { workLogs, count };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getWorkLog(
  supabase: SupabaseClient,
  workLogId: string
) {
  try {
    const { data, error } = await supabase
      .from('WorkLogs')
      .select(`
        *,
        employee:Employees(id, given_name, surname),
        schedule_type:WorkScheduleTypes(id, name, multiplier)
      `)
      .eq('id', workLogId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function addWorkLog(
  supabase: SupabaseClient,
  workLogData: any
) {
  try {
    const { data, error } = await supabase
      .from('WorkLogs')
      .insert([workLogData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function updateWorkLog(
  supabase: SupabaseClient,
  workLogData: any
) {
  try {
    const { data, error } = await supabase
      .from('WorkLogs')
      .update(workLogData)
      .eq('id', workLogData.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function approveWorkLog(
  supabase: SupabaseClient,
  workLogId: string,
  approverId: string
) {
  try {
    const { data, error } = await supabase
      .from('WorkLogs')
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString()
      })
      .eq('id', workLogId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function rejectWorkLog(
  supabase: SupabaseClient,
  workLogId: string,
  approverId: string
) {
  try {
    const { data, error } = await supabase
      .from('WorkLogs')
      .update({
        status: 'rejected',
        approved_by: approverId,
        approved_at: new Date().toISOString()
      })
      .eq('id', workLogId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function bulkAddWorkLogs(
  supabase: SupabaseClient,
  workLogs: any[]
) {
  try {
    const { data, error } = await supabase
      .from('WorkLogs')
      .insert(workLogs.map(log => ({
        ...log,
        status: 'pending'
      })))
      .select();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}