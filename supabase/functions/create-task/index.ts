import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateTaskRequest {
  project_id: string
  product_id: number
  assignee_id?: string
  quantity?: number
  variant_description?: string
}

// Calculate due date by adding business days (excluding weekends)
function addBusinessDays(startDate: Date, daysToAdd: number): Date {
  const date = new Date(startDate)
  let remainingDays = daysToAdd
  
  while (remainingDays > 0) {
    date.setDate(date.getDate() + 1)
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      remainingDays--
    }
  }
  
  return date
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error('Authentication error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const requestData: CreateTaskRequest = await req.json()
    const { project_id, product_id, assignee_id, quantity = 1, variant_description } = requestData

    console.log('Creating task with data:', requestData)

    // 1. Verify the project exists and belongs to the user's client
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select(`
        id,
        client_id,
        clients(user_id)
      `)
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      console.error('Project not found:', projectError)
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user owns this client
    const clientUserIdCheck = project.clients as any
    if (!clientUserIdCheck || clientUserIdCheck.user_id !== user.id) {
      console.error('User does not own this client')
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 2. Get the negotiated price and SLA from client_services
    const { data: clientService, error: serviceError } = await supabaseClient
      .from('client_services')
      .select('negotiated_price, sla_days, is_active')
      .eq('client_id', project.client_id)
      .eq('product_id', product_id)
      .single()

    if (serviceError || !clientService) {
      console.error('Client service not found:', serviceError)
      return new Response(
        JSON.stringify({ 
          error: 'Este cliente não tem este produto/serviço contratado. Por favor, adicione o serviço ao cliente primeiro.' 
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!clientService.is_active) {
      return new Response(
        JSON.stringify({ 
          error: 'Este serviço está inativo para este cliente' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 3. Calculate due_date by adding SLA business days to current date
    const today = new Date()
    const dueDate = addBusinessDays(today, clientService.sla_days)
    const dueDateString = dueDate.toISOString().split('T')[0] // Format as YYYY-MM-DD

    console.log('Calculated due date:', {
      today: today.toISOString(),
      sla_days: clientService.sla_days,
      due_date: dueDateString
    })

    // 4. Create the task with frozen values
    const { data: newTask, error: taskError } = await supabaseClient
      .from('tasks')
      .insert({
        project_id,
        product_id,
        assignee_id: assignee_id || null,
        status: 'Backlog',
        quantity,
        variant_description: variant_description || null,
        frozen_price: clientService.negotiated_price,
        frozen_sla_days: clientService.sla_days,
        due_date: dueDateString,
      })
      .select(`
        *,
        projects(name, clients(name)),
        products(name)
      `)
      .single()

    if (taskError) {
      console.error('Error creating task:', taskError)
      return new Response(
        JSON.stringify({ error: 'Failed to create task', details: taskError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Task created successfully:', newTask.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        task: newTask,
        message: 'Tarefa criada com sucesso'
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
