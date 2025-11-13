import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TranscriptMessage {
  speaker: "Doctor" | "Patient";
  text: string;
  timestamp: number;
}

interface TranscriptionPanelProps {
  onTranscriptUpdate?: (transcript: TranscriptMessage[]) => void;
}

export const TranscriptionPanel = ({ onTranscriptUpdate }: TranscriptionPanelProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (onTranscriptUpdate) {
      onTranscriptUpdate(transcripts);
    }
  }, [transcripts, onTranscriptUpdate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processAudioChunks();
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start duration timer
      intervalRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording started",
        description: "Speak naturally during the consultation",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to access microphone",
        variant: "destructive",
      });
    }
  };

  const processAudioChunks = async () => {
    if (audioChunksRef.current.length === 0) return;

    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error('Failed to convert audio');
        }

        // Call transcription edge function
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audioBase64: base64Audio }
        });

        if (error) throw error;

        if (data.text) {
          const newMessage: TranscriptMessage = {
            speaker: transcripts.length % 2 === 0 ? "Doctor" : "Patient",
            text: data.text,
            timestamp: Date.now(),
          };
          
          setTranscripts(prev => [...prev, newMessage]);
          
          toast({
            title: "Transcription complete",
            description: "Audio has been transcribed",
          });
        }
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Transcription failed",
        description: error.message || "Failed to transcribe audio",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        intervalRef.current = window.setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Live Transcription</h3>
          {isRecording && (
            <Badge className="bg-alert-red animate-pulse">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-white" />
                Recording
              </span>
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          {!isRecording ? (
            <Button 
              onClick={startRecording}
              className="bg-medical-blue hover:bg-medical-blue/90"
              disabled={isProcessing}
            >
              <Mic className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={togglePause}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={stopRecording}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 bg-muted/30 rounded-lg p-4">
        {transcripts.length === 0 && !isRecording && (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No transcripts yet. Start recording to begin.</p>
          </div>
        )}
        
        {transcripts.map((message, index) => (
          <div key={index} className="space-y-2">
            <div className="flex gap-2">
              <Badge 
                variant="outline" 
                className={message.speaker === "Patient" ? "text-xs bg-secondary" : "text-xs"}
              >
                {message.speaker}
              </Badge>
              <p className="text-sm text-foreground flex-1">
                {message.text}
              </p>
            </div>
          </div>
        ))}

        {isRecording && !isPaused && (
          <div className="flex gap-2 animate-pulse">
            <Badge variant="outline" className="text-xs">
              {transcripts.length % 2 === 0 ? "Doctor" : "Patient"}
            </Badge>
            <p className="text-sm text-muted-foreground italic">
              Listening...
            </p>
          </div>
        )}
        
        {isProcessing && (
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">AI</Badge>
            <p className="text-sm text-muted-foreground italic">
              Processing transcription...
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Duration: {formatDuration(duration)}</span>
          <span className="flex items-center gap-2">
            Powered by <span className="font-semibold text-medical-teal">Lovable AI</span>
          </span>
        </div>
      </div>
    </Card>
  );
};
