import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Save, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TranscriptMessage {
  speaker: "Doctor" | "Patient";
  text: string;
  timestamp: number;
}

interface ClinicalNotesProps {
  transcript?: TranscriptMessage[];
  consultationId?: string;
}

export const ClinicalNotes = ({ transcript = [], consultationId }: ClinicalNotesProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchClinicalNotes = async () => {
      if (!consultationId) return;

      try {
        const { data, error } = await supabase
          .from('clinical_notes')
          .select('*')
          .eq('consultation_id', consultationId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setSubjective(data.subjective || "");
          setObjective(data.objective || "");
          setAssessment(data.assessment || "");
          setPlan(data.plan || "");
        }
      } catch (error) {
        console.error('Error fetching clinical notes:', error);
      }
    };

    fetchClinicalNotes();
  }, [consultationId]);

  const handleGenerate = async () => {
    if (transcript.length === 0) {
      toast({
        title: "No transcript available",
        description: "Please record a consultation first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Convert transcript to text format
      const transcriptText = transcript
        .map(msg => `${msg.speaker}: ${msg.text}`)
        .join('\n\n');

      const { data, error } = await supabase.functions.invoke('generate-soap-notes', {
        body: { 
          transcript: transcriptText,
          patientInfo: null
        }
      });

      if (error) throw error;

      if (data) {
        setSubjective(data.subjective || "");
        setObjective(data.objective || "");
        setAssessment(data.assessment || "");
        setPlan(data.plan || "");
        
        toast({
          title: "SOAP notes generated",
          description: "AI has created clinical documentation from the transcript",
        });
      }
    } catch (error) {
      console.error('Error generating SOAP notes:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate SOAP notes",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const allNotes = `SUBJECTIVE:\n${subjective}\n\nOBJECTIVE:\n${objective}\n\nASSESSMENT:\n${assessment}\n\nPLAN:\n${plan}`;
    navigator.clipboard.writeText(allNotes);
    toast({
      title: "Copied to clipboard",
      description: "SOAP notes have been copied",
    });
  };

  const handleSave = async () => {
    if (!consultationId) {
      toast({
        title: "Error",
        description: "No consultation ID found",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('Not authenticated');
      }

      const { data: existing } = await supabase
        .from('clinical_notes')
        .select('id')
        .eq('consultation_id', consultationId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('clinical_notes')
          .update({
            subjective,
            objective,
            assessment,
            plan,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clinical_notes')
          .insert({
            consultation_id: consultationId,
            doctor_id: session.session.user.id,
            subjective,
            objective,
            assessment,
            plan,
          });

        if (error) throw error;
      }

      toast({
        title: "Notes saved",
        description: "Clinical notes have been saved successfully",
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error",
        description: "Failed to save clinical notes",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Clinical Documentation</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating || transcript.length === 0}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Auto-Generate"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button size="sm" className="bg-success hover:bg-success/90" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Note
          </Button>
        </div>
      </div>

      <Tabs defaultValue="soap" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="soap">SOAP</TabsTrigger>
          <TabsTrigger value="prescription">Prescription</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="followup">Follow-up</TabsTrigger>
        </TabsList>

        <TabsContent value="soap" className="flex-1 space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">S</Badge>
              <label className="text-sm font-medium">Subjective</label>
            </div>
            <Textarea 
              placeholder="Patient's chief complaint and history..."
              className="min-h-[100px] resize-none"
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">O</Badge>
              <label className="text-sm font-medium">Objective</label>
            </div>
            <Textarea 
              placeholder="Physical examination findings..."
              className="min-h-[100px] resize-none"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">A</Badge>
              <label className="text-sm font-medium">Assessment</label>
            </div>
            <Textarea 
              placeholder="Diagnosis and clinical impression..."
              className="min-h-[80px] resize-none"
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">P</Badge>
              <label className="text-sm font-medium">Plan</label>
            </div>
            <Textarea 
              placeholder="Treatment plan and recommendations..."
              className="min-h-[100px] resize-none"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            />
          </div>
        </TabsContent>

        <TabsContent value="prescription" className="flex-1 mt-4">
          <p className="text-sm text-muted-foreground">Prescription management will be available here</p>
        </TabsContent>

        <TabsContent value="orders" className="flex-1 mt-4">
          <p className="text-sm text-muted-foreground">Lab orders and tests will be available here</p>
        </TabsContent>

        <TabsContent value="followup" className="flex-1 mt-4">
          <p className="text-sm text-muted-foreground">Follow-up scheduling will be available here</p>
        </TabsContent>
      </Tabs>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            AI-assisted by <span className="font-semibold text-medical-teal">Lovable AI</span>
          </span>
          <span className="text-muted-foreground">Transcript messages: {transcript.length}</span>
        </div>
      </div>
    </Card>
  );
};
