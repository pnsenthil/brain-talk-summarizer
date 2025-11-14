import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TranscriptionPanel } from "@/components/consultation/TranscriptionPanel";
import { ClinicalNotes } from "@/components/consultation/ClinicalNotes";
import { GuidelinePanel } from "@/components/consultation/GuidelinePanel";
import { ArrowLeft, User } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TranscriptMessage {
  speaker: "Doctor" | "Patient";
  text: string;
  timestamp: number;
}

interface PatientInfo {
  full_name: string;
  mrn: string;
  date_of_birth: string;
  diagnosis: string | null;
}

const Consultation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConsultation = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('consultations')
          .select(`
            id,
            transcription,
            patient_id,
            patients (
              full_name,
              mrn,
              date_of_birth,
              diagnosis
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data?.patients) {
          setPatientInfo(data.patients as PatientInfo);
        }

        if (data?.transcription) {
          try {
            const parsedTranscript = JSON.parse(data.transcription);
            setTranscript(parsedTranscript);
          } catch {
            console.error('Failed to parse transcript');
          }
        }
      } catch (error) {
        console.error('Error fetching consultation:', error);
        toast({
          title: "Error",
          description: "Failed to load consultation details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultation();
  }, [id, toast]);

  const handleTranscriptUpdate = async (updatedTranscript: TranscriptMessage[]) => {
    setTranscript(updatedTranscript);
    
    if (id) {
      try {
        const { error } = await supabase
          .from('consultations')
          .update({ transcription: JSON.stringify(updatedTranscript) })
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        console.error('Error saving transcript:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Loading...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/queue")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Consultation</h2>
          <p className="text-muted-foreground mt-1">
            {patientInfo ? `Active session with ${patientInfo.full_name}` : 'Loading patient info...'}
          </p>
        </div>
        <Button variant="outline">End Consultation</Button>
      </div>

      {/* Patient Info Card */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <div className="h-16 w-16 rounded-full bg-medical-blue/10 flex items-center justify-center">
            <User className="h-8 w-8 text-medical-blue" />
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Patient</p>
              <p className="font-semibold text-foreground">{patientInfo?.full_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MRN</p>
              <p className="font-semibold text-foreground">{patientInfo?.mrn || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-semibold text-foreground">
                {patientInfo?.date_of_birth ? new Date(patientInfo.date_of_birth).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Diagnosis</p>
              <p className="font-semibold text-foreground">{patientInfo?.diagnosis || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Triage Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="font-semibold">Triage Summary</h4>
            <Badge className="bg-success text-success-foreground">Completed</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Chief Complaint:</p>
              <p className="text-foreground">Increased seizure frequency (3-4 episodes/week)</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Triggers Identified:</p>
              <p className="text-foreground">Sleep disruption, morning hours</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Current Medication:</p>
              <p className="text-foreground">Levetiracetam 1000mg BID</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Adherence:</p>
              <p className="text-foreground">Good (95% self-reported)</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Consultation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Transcription & Notes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="h-[400px]">
            <TranscriptionPanel onTranscriptUpdate={handleTranscriptUpdate} />
          </div>
          <div className="h-[600px]">
            <ClinicalNotes transcript={transcript} consultationId={id} />
          </div>
        </div>

        {/* Right Column - Guidelines & Alerts */}
        <div className="h-[1050px]">
          <GuidelinePanel />
        </div>
      </div>
    </div>
  );
};

export default Consultation;
