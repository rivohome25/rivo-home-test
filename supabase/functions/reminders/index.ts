import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get send-email function URL
    const SEND_EMAIL_URL = `${supabaseUrl}/functions/v1/send-email`;
    const APP_ORIGIN = Deno.env.get('APP_ORIGIN') || 'https://app.rivohome.com';

    // Get today and tomorrow dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format dates as YYYY-MM-DD
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Calculate 7 days from now
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];

    // Query for tasks due tomorrow (1-day reminder) - no opt-in needed
    const { data: tasksDueTomorrow, error: err1 } = await supabase
      .from('view_user_tasks_with_details')
      .select('*')
      .eq('due_date', tomorrowStr)
      .eq('reminder_sent_1day', false)
      .eq('completed', false);

    if (err1) {
      console.error('Error querying 1-day tasks:', err1);
      return new Response(JSON.stringify({ error: err1.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Query for tasks due in 7 days (7-day reminder) - requires opt-in
    const { data: tasksDue7Days, error: err7 } = await supabase
      .from('view_user_tasks_with_details')
      .select('*')
      .eq('due_date', sevenDaysStr)
      .eq('reminder_sent_7day', false)
      .eq('completed', false);

    if (err7) {
      console.error('Error querying 7-day tasks:', err7);
      return new Response(JSON.stringify({ error: err7.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group tasks by user to send consolidated emails
    const userTasksMap = new Map();

    // Process tomorrow's tasks
    for (const task of tasksDueTomorrow || []) {
      if (!userTasksMap.has(task.user_id)) {
        userTasksMap.set(task.user_id, { tomorrow: [], sevenDays: [] });
      }
      userTasksMap.get(task.user_id).tomorrow.push(task);
    }

    // Process 7-day tasks
    for (const task of tasksDue7Days || []) {
      if (!userTasksMap.has(task.user_id)) {
        userTasksMap.set(task.user_id, { tomorrow: [], sevenDays: [] });
      }
      userTasksMap.get(task.user_id).sevenDays.push(task);
    }

    // Send emails for each user
    const emailsSent = { tomorrow: 0, sevenDays: 0 };
    const tasksUpdated = { tomorrow: 0, sevenDays: 0 };
    
    for (const [userId, tasks] of userTasksMap) {
      // Get user profile with opt-in preference
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('opt_in_7day_reminders')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error(`Error fetching profile for user ${userId}:`, profileError);
        continue;
      }

      // Get user email
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !userData.user) {
        console.error(`Error fetching user ${userId}:`, userError);
        continue;
      }

      const userEmail = userData.user.email;
      if (!userEmail) continue;

      // Send 1-day reminder email (always sent)
      if (tasks.tomorrow.length > 0) {
        const subject = 'RivoHome: Tasks Due Tomorrow';
        let htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Tasks Due Tomorrow</h2>
            <p>Hi there,</p>
            <p>This is a reminder that you have the following maintenance tasks due tomorrow:</p>
            <ul style="list-style: none; padding: 0;">
        `;

        for (const task of tasks.tomorrow) {
          const formattedDate = new Date(task.due_date).toLocaleDateString();
          htmlContent += `
            <li style="margin-bottom: 15px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
              <strong>${task.task_name}</strong><br>
              <span style="color: #666;">${task.task_description}</span><br>
              <span style="color: #666; font-size: 14px;">Property: ${task.property_address}</span><br>
              <span style="color: #666; font-size: 14px;">Due: ${formattedDate}</span>
            </li>
          `;
        }

        htmlContent += `
            </ul>
            <p style="margin-top: 20px;">
              <a href="${APP_ORIGIN}/dashboard/my-schedule" 
                 style="display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 6px;">
                View All Tasks
              </a>
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Thanks,<br/>The RivoHome Team
            </p>
          </div>
        `;

        // Send email
        try {
          const emailResponse = await fetch(SEND_EMAIL_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ to: userEmail, subject, html: htmlContent }),
          });

          if (emailResponse.ok) {
            emailsSent.tomorrow++;
            
            // Mark tasks as reminder sent
            for (const task of tasks.tomorrow) {
              await supabase
                .from('user_tasks')
                .update({ reminder_sent_1day: true })
                .eq('id', task.id);
              tasksUpdated.tomorrow++;
            }
          } else {
            console.error('Failed to send 1-day reminder email:', await emailResponse.text());
          }
        } catch (error) {
          console.error('Error sending 1-day reminder email:', error);
        }
      }

      // Send 7-day reminder email (only if opted in)
      if (tasks.sevenDays.length > 0 && profile?.opt_in_7day_reminders) {
        const subject = 'RivoHome: Upcoming Tasks in 7 Days';
        let htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Upcoming Tasks in 7 Days</h2>
            <p>Hi there,</p>
            <p>This is an early reminder that you have the following maintenance tasks due in one week:</p>
            <ul style="list-style: none; padding: 0;">
        `;

        for (const task of tasks.sevenDays) {
          const formattedDate = new Date(task.due_date).toLocaleDateString();
          htmlContent += `
            <li style="margin-bottom: 15px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
              <strong>${task.task_name}</strong><br>
              <span style="color: #666;">${task.task_description}</span><br>
              <span style="color: #666; font-size: 14px;">Property: ${task.property_address}</span><br>
              <span style="color: #666; font-size: 14px;">Due: ${formattedDate}</span>
            </li>
          `;
        }

        htmlContent += `
            </ul>
            <p style="margin-top: 20px;">
              <a href="${APP_ORIGIN}/dashboard/my-schedule" 
                 style="display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 6px;">
                View All Tasks
              </a>
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Thanks,<br/>The RivoHome Team
            </p>
          </div>
        `;

        // Send email
        try {
          const emailResponse = await fetch(SEND_EMAIL_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ to: userEmail, subject, html: htmlContent }),
          });

          if (emailResponse.ok) {
            emailsSent.sevenDays++;
            
            // Mark tasks as reminder sent
            for (const task of tasks.sevenDays) {
              await supabase
                .from('user_tasks')
                .update({ reminder_sent_7day: true })
                .eq('id', task.id);
              tasksUpdated.sevenDays++;
            }
          } else {
            console.error('Failed to send 7-day reminder email:', await emailResponse.text());
          }
        } catch (error) {
          console.error('Error sending 7-day reminder email:', error);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed reminders successfully`,
        details: {
          tasksDueTomorrow: tasksDueTomorrow?.length || 0,
          tasksDue7Days: tasksDue7Days?.length || 0,
          emailsSent,
          tasksUpdated,
          usersProcessed: userTasksMap.size
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in reminders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}); 