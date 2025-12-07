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
    const { audioBase64 } = await req.json();
    
    if (!audioBase64) {
      throw new Error('No audio data provided');
    }

    const ASSEMBLYAI_API_KEY = Deno.env.get('ASSEMBLYAI_API_KEY');
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error('ASSEMBLYAI_API_KEY not configured');
    }

    console.log('Processing audio transcription with AssemblyAI...');

    // Convert base64 to binary
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload audio to AssemblyAI
    console.log('Uploading audio to AssemblyAI...');
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/octet-stream',
      },
      body: bytes,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload error:', uploadResponse.status, errorText);
      throw new Error(`Failed to upload audio: ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    console.log('Audio uploaded, URL:', uploadData.upload_url);

    // Create transcription request
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: uploadData.upload_url,
        speaker_labels: true,
      }),
    });

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error('Transcription request error:', transcriptResponse.status, errorText);
      throw new Error(`Failed to start transcription: ${errorText}`);
    }

    const transcriptData = await transcriptResponse.json();
    console.log('Transcript ID:', transcriptData.id);

    // Poll for completion
    let status = transcriptData.status;
    let result = transcriptData;
    
    while (status !== 'completed' && status !== 'error') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}`, {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
        },
      });

      if (!pollResponse.ok) {
        throw new Error('Failed to poll transcription status');
      }

      result = await pollResponse.json();
      status = result.status;
      console.log('Transcription status:', status);
    }

    if (status === 'error') {
      throw new Error(`Transcription failed: ${result.error}`);
    }

    console.log('Transcription completed');

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transcribe-audio:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
