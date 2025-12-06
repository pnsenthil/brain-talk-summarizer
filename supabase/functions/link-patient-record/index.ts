import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email } = await req.json();
    
    if (!userId || !email) {
      throw new Error('userId and email are required');
    }

    console.log('Linking patient record for user:', userId, 'email:', email);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Find patient record by email and link to user
    const { data: patient, error: findError } = await supabaseAdmin
      .from('patients')
      .select('id, full_name')
      .eq('email', email)
      .is('user_id', null)
      .single();

    if (findError) {
      console.log('No unlinked patient record found for email:', email);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No patient record found for this email' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Link the patient record to the user
    const { error: updateError } = await supabaseAdmin
      .from('patients')
      .update({ user_id: userId })
      .eq('id', patient.id);

    if (updateError) {
      throw updateError;
    }

    console.log('Successfully linked patient:', patient.full_name, 'to user:', userId);

    return new Response(JSON.stringify({ 
      success: true, 
      patientId: patient.id,
      patientName: patient.full_name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error linking patient record:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
