import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Play, Pause } from "lucide-react";
import { useState } from "react";

export const TranscriptionPanel = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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
              onClick={() => setIsRecording(true)}
              className="bg-medical-blue hover:bg-medical-blue/90"
            >
              <Mic className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsPaused(!isPaused)}
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
                onClick={() => {
                  setIsRecording(false);
                  setIsPaused(false);
                }}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 bg-muted/30 rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">Doctor</Badge>
            <p className="text-sm text-foreground">
              Good morning. How have you been feeling since your last visit?
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs bg-secondary">Patient</Badge>
            <p className="text-sm text-foreground">
              I've been having more frequent episodes. About 3-4 times this week, mostly in the morning.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">Doctor</Badge>
            <p className="text-sm text-foreground">
              Can you describe what happens during these episodes? Any triggers you've noticed?
            </p>
          </div>
        </div>

        {isRecording && !isPaused && (
          <div className="flex gap-2 animate-pulse">
            <Badge variant="outline" className="text-xs">Doctor</Badge>
            <p className="text-sm text-muted-foreground italic">
              Listening...
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Duration: {isRecording ? "2:34" : "0:00"}</span>
          <span className="flex items-center gap-2">
            Powered by <span className="font-semibold text-medical-teal">Gemini</span>
          </span>
        </div>
      </div>
    </Card>
  );
};
