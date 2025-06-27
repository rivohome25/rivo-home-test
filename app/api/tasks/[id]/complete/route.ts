import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the task ID from params
    const { id: taskId } = await params;
    
    // Parse the request body
    const body = await request.json();
    const { completed_by } = body;

    // Validate completion method
    if (!completed_by || !['diy', 'professional'].includes(completed_by)) {
      return NextResponse.json(
        { error: 'Invalid completion method. Must be "diy" or "professional".' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First, try to find the task in the custom tasks table
    const { data: customTask, error: customTaskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    let taskData = null;
    let isCustomTask = false;

    if (!customTaskError && customTask) {
      // This is a custom task from the tasks table
      isCustomTask = true;
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) {
        console.error('Error completing custom task:', error);
        return NextResponse.json(
          { error: 'Failed to complete task' },
          { status: 500 }
        );
      }

      taskData = {
        ...data,
        task_name: data.title,
        task_description: data.description,
        property_id: null // Custom tasks don't have property_id
      };
    } else {
      // Try to find in maintenance tasks (user_tasks table)
      const { data, error } = await supabase
        .from('user_tasks')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          completed_by
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select(`
          *,
          master_tasks(name, description)
        `)
        .single();

      if (error) {
        console.error('Error completing maintenance task:', error);
        return NextResponse.json(
          { error: 'Failed to complete task' },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Task not found or unauthorized' },
          { status: 404 }
        );
      }

      taskData = {
        ...data,
        task_name: data.master_tasks?.name || 'Unknown Task',
        task_description: data.master_tasks?.description || ''
      };
    }

    // Create a task history record for Rivo Reports (only for maintenance tasks with property_id)
    if (!isCustomTask && taskData.property_id) {
      const historySource = completed_by === 'professional' ? 'verified_pro' : 'diy_upload';
      const verificationLevel = completed_by === 'professional' ? 1.0 : 0.9;

      const { error: historyError } = await supabase
        .from('user_task_history')
        .insert({
          user_id: user.id,
          property_id: taskData.property_id,
          task_type: taskData.task_name,
          task_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD
          source: historySource,
          verification_level: verificationLevel,
          notes: `Task completed via modal - ${completed_by === 'diy' ? 'DIY completion' : 'Professional service'}`,
          media_url: null
        });

      // Don't fail the main operation if history creation fails, but log it
      if (historyError) {
        console.error('Failed to create task history record:', historyError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      task: taskData,
      task_type: isCustomTask ? 'custom' : 'maintenance'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 