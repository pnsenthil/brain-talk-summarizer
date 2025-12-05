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
    const { audioUrl } = await req.json();
    
    if (!audioUrl) {
      throw new Error('No audio URL provided');
    }

    const ASSEMBLYAI_API_KEY = Deno.env.get('ASSEMBLYAI_API_KEY');
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error('ASSEMBLYAI_API_KEY is not configured');
    }

    console.log('Starting transcription for:', audioUrl);

    // Create transcription request
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        speaker_labels: true,
      }),
    });

    if (!transcriptResponse.ok) {
      const error = await transcriptResponse.text();
      console.error('AssemblyAI error:', error);
      throw new Error(`AssemblyAI API error: ${error}`);
    }

    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;

    console.log('Transcript ID:', transcriptId);

    // Poll for completion
    let transcript;
    while (true) {
      const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
        },
      });

      transcript = await pollingResponse.json();

      if (transcript.status === 'completed') {
        console.log('Transcription completed');
        break;
      } else if (transcript.status === 'error') {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      // Wait 1 second before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return new Response(JSON.stringify({
      text: transcript.text,
      utterances: transcript.utterances,
      words: transcript.words,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
