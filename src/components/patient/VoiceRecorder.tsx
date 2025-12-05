import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Pause, Play, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VoiceRecorderProps {
  patientId: string;
  consultationId?: string;
  onUploadComplete?: (uploadId: string) => void;
}

export function VoiceRecorder({ patientId, consultationId, onUploadComplete }: VoiceRecorderProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcription, setTranscription] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setTranscription(null);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      toast({ title: "Recording started", description: "Speak clearly into your microphone" });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({ title: "Error", description: "Could not access microphone", variant: "destructive" });
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    
    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    setIsProcessing(true);
    if (timerRef.current) clearInterval(timerRef.current);

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        
        try {
          // Upload to Supabase storage
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Not authenticated");

          const fileName = `${user.id}/${Date.now()}.webm`;
          const { error: uploadError } = await supabase.storage
            .from('patient-uploads')
            .upload(fileName, audioBlob);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('patient-uploads')
            .getPublicUrl(fileName);

          toast({ title: "Uploading complete", description: "Starting transcription..." });

          // Call transcription function
          const { data: transcriptData, error: transcriptError } = await supabase.functions
            .invoke('transcribe-assemblyai', {
              body: { audioUrl: publicUrl }
            });

          if (transcriptError) throw transcriptError;

          const transcribedText = transcriptData.text;
          setTranscription(transcribedText);

          // Generate summary
          const { data: summaryData } = await supabase.functions
            .invoke('generate-summary', {
              body: { transcription: transcribedText, type: 'summary' }
            });

          // Save to database
          const { data: uploadRecord, error: dbError } = await supabase
            .from('patient_uploads')
            .insert({
              patient_id: patientId,
              consultation_id: consultationId,
              upload_type: 'voice_note',
              file_url: publicUrl,
              file_name: fileName,
              transcription: transcribedText,
              summary: summaryData?.summary,
              uploaded_by: user.id,
            })
            .select()
            .single();

          if (dbError) throw dbError;

          toast({ title: "Success", description: "Voice note saved and transcribed" });
          onUploadComplete?.(uploadRecord.id);

        } catch (error: any) {
          console.error("Error processing recording:", error);
          toast({ 
            title: "Error", 
            description: error.message || "Failed to process recording", 
            variant: "destructive" 
          });
        } finally {
          setIsProcessing(false);
          setIsRecording(false);
          resolve();
        }
      };

      mediaRecorderRef.current!.stop();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Note
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <Button 
              onClick={startRecording} 
              disabled={isProcessing}
              className="bg-red-500 hover:bg-red-600"
            >
              <Mic className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={togglePause}
                disabled={isProcessing}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                variant="destructive"
                onClick={stopRecording}
                disabled={isProcessing}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>

        {(isRecording || isProcessing) && (
          <div className="text-center">
            <p className="text-2xl font-mono">{formatDuration(duration)}</p>
            <p className="text-sm text-muted-foreground">
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : isPaused ? "Paused" : "Recording..."}
            </p>
          </div>
        )}

        {transcription && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Transcription</h4>
            <p className="text-sm text-muted-foreground">{transcription}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
