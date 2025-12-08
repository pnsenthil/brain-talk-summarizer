import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Play, Pause, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface TranscriptMessage {
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
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
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
    setProcessingProgress(10);
    
    // Start progress animation
    progressIntervalRef.current = window.setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 85) return prev;
        return prev + Math.random() * 5;
      });
    }, 1000);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert blob to base64 using Promise
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result?.toString().split(',')[1];
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Failed to convert audio'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read audio file'));
        reader.readAsDataURL(audioBlob);
      });

      setProcessingProgress(30);

      // Call transcription edge function
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioBase64: base64Audio }
      });

      if (error) throw error;

      setProcessingProgress(90);

      // Just use the plain text transcription
      if (data.text) {
        const newMessage: TranscriptMessage = {
          text: data.text,
          timestamp: Date.now(),
        };
        setTranscripts(prev => [...prev, newMessage]);
      }
      
      setProcessingProgress(100);
      
      toast({
        title: "Transcription complete",
        description: "Audio has been transcribed",
      });
    } catch (error: any) {
      console.error('Error processing audio:', error);
      toast({
        title: "Transcription failed",
        description: error.message || "Failed to transcribe audio",
        variant: "destructive",
      });
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress(0);
      }, 1000);
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
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
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
          {isProcessing && (
            <Badge className="bg-medical-blue">
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Transcribing
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

      {/* Transcription Progress Indicator */}
      {isProcessing && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-medical-blue" />
              Processing transcription...
            </span>
            <span className="text-muted-foreground">{Math.round(processingProgress)}%</span>
          </div>
          <Progress value={processingProgress} className="h-2" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 bg-muted/30 rounded-lg p-4">
        {transcripts.length === 0 && !isRecording && !isProcessing && (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No transcripts yet. Start recording to begin.</p>
          </div>
        )}
        
        {transcripts.map((message, index) => (
          <div key={index} className="p-3 bg-background rounded-lg border">
            <p className="text-sm text-foreground">{message.text}</p>
            <span className="text-xs text-muted-foreground mt-1 block">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}

        {isRecording && !isPaused && (
          <div className="p-3 bg-background rounded-lg border animate-pulse">
            <p className="text-sm text-muted-foreground italic">
              Listening...
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Duration: {formatDuration(duration)}</span>
          <span className="flex items-center gap-2">
            Powered by <span className="font-semibold text-medical-teal">AssemblyAI</span>
          </span>
        </div>
      </div>
    </Card>
  );
};
