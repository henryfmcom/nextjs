import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { employee_id, tenant_id } = await req.json()

    // Log environment variables (redacted for security)
    console.log('Environment check:', {
      hasProjectUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    })

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Log request data (safely)
    console.log('Processing request for:', {
      employee_id,
      tenant_id,
      timestamp: new Date().toISOString(),
    })

    // Get employee details
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('Employees')
      .select('company_email, given_name, surname')
      .eq('id', employee_id)
      .single()

    if (employeeError) {
      console.error('Employee fetch error:', employeeError)
      throw employeeError
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser.users.find(u => u.email === employee.company_email)

    let userId = userExists?.id

    if (!userExists) {
      // Invite new user
      const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        employee.company_email,
        {
          data: {
            given_name: employee.given_name,
            surname: employee.surname,
          }
        }
      )
      if (inviteError) throw inviteError
      userId = authData.user.id
    }

    // Check if UserTenant record exists
    const { data: existingUserTenant } = await supabaseAdmin
      .from('UserTenants')
      .select('id')
      .eq('user_id', userId)
      .eq('tenant_id', tenant_id)
      .maybeSingle()

    if (!existingUserTenant) {
      // Create UserTenant record
      const { error: userTenantError } = await supabaseAdmin
        .from('UserTenants')
        .insert({
          user_id: userId,
          tenant_id: tenant_id,
          role: 'employee'
        })
      if (userTenantError) throw userTenantError
    }

    // Update employee invited status
    const { error: updateError } = await supabaseAdmin
      .from('Employees')
      .update({ is_invited: true })
      .eq('id', employee_id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    // Enhanced error logging
    console.error('Function error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    })

    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.name,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
}) 