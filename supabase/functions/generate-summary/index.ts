import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcription, type } = await req.json();
    
    if (!transcription) {
      throw new Error('No transcription provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    if (type === 'soap') {
      systemPrompt = `You are a medical documentation assistant. Generate SOAP notes from the following patient voice note or consultation transcript.
      
Return a JSON object with these exact fields:
- subjective: Patient's reported symptoms, concerns, and history
- objective: Observable/measurable findings mentioned
- assessment: Clinical assessment and potential diagnoses
- plan: Recommended treatment plan and follow-up

Be concise and professional. Use medical terminology appropriately.`;
    } else {
      systemPrompt = `You are a medical documentation assistant. Summarize the following patient voice note or medical information in a clear, concise manner suitable for a doctor to review before consultation.

Focus on:
- Main symptoms or concerns
- Relevant medical history mentioned
- Current medications if mentioned
- Questions or requests the patient has

Be professional and organized.`;
    }

    console.log('Generating summary with Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcription }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const error = await response.text();
      console.error('Lovable AI error:', error);
      throw new Error(`AI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (type === 'soap') {
      // Try to parse as JSON for SOAP notes
      try {
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        const soapNotes = JSON.parse(jsonStr);
        return new Response(JSON.stringify(soapNotes), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch {
        return new Response(JSON.stringify({ summary: content }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ summary: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Summary generation error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
