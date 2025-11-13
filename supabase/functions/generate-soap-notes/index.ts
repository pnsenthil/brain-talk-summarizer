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
    const { transcript, patientInfo } = await req.json();
    
    if (!transcript) {
      throw new Error('No transcript provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating SOAP notes from transcript...');

    const systemPrompt = `You are a medical documentation assistant specialized in creating SOAP notes for epilepsy consultations. 
Generate structured, professional SOAP notes from consultation transcripts.

Format the response as JSON with these sections:
- subjective: Patient's reported symptoms, concerns, and history
- objective: Observable findings, vital signs, examination results
- assessment: Medical assessment and diagnosis
- plan: Treatment plan, medications, follow-up instructions

Keep medical terminology accurate and professional. Focus on epilepsy-related observations.`;

    const userPrompt = `Generate SOAP notes from this consultation transcript:

${patientInfo ? `Patient Context: ${JSON.stringify(patientInfo)}` : ''}

Transcript:
${transcript}

Return ONLY valid JSON in this exact format:
{
  "subjective": "string",
  "objective": "string", 
  "assessment": "string",
  "plan": "string"
}`;

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI generation error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI generation failed: ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    let jsonContent = content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    } else {
      const codeMatch = content.match(/```\n([\s\S]*?)\n```/);
      if (codeMatch) {
        jsonContent = codeMatch[1];
      }
    }

    const soapNotes = JSON.parse(jsonContent.trim());
    console.log('SOAP notes generated successfully');

    return new Response(
      JSON.stringify(soapNotes),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-soap-notes:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
