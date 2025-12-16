import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TranscriptionPanel } from "@/components/consultation/TranscriptionPanel";
import { ClinicalNotes } from "@/components/consultation/ClinicalNotes";
import { GuidelinePanel } from "@/components/consultation/GuidelinePanel";
import { PatientUploadsPanel } from "@/components/consultation/PatientUploadsPanel";
import { ArrowLeft, User, CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TranscriptMessage {
  speaker: "Doctor" | "Patient";
  text: string;
  timestamp: number;
}

interface PatientInfo {
  id: string;
  full_name: string;
  mrn: string;
  date_of_birth: string;
  diagnosis: string | null;
}

interface SoapNotes {
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
}

const Consultation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [soapNotes, setSoapNotes] = useState<SoapNotes>({
    subjective: null,
    objective: null,
    assessment: null,
    plan: null,
  });
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [consultationStatus, setConsultationStatus] = useState<string | null>(null);

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
            status,
            patients (
              id,
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

        setConsultationStatus(data?.status || null);

        if (data?.transcription) {
          try {
            const parsedTranscript = JSON.parse(data.transcription);
            setTranscript(parsedTranscript);
          } catch {
            console.error('Failed to parse transcript');
          }
        }

        // Fetch existing clinical notes
        const { data: notesData } = await supabase
          .from('clinical_notes')
          .select('subjective, objective, assessment, plan')
          .eq('consultation_id', id)
          .single();

        if (notesData) {
          setSoapNotes(notesData);
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

  // Debounce timer ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const handleTranscriptUpdate = useCallback((updatedTranscript: TranscriptMessage[]) => {
    setTranscript(updatedTranscript);
    
    if (!id || updatedTranscript.length === 0) return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save operation
    saveTimeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      
      isSavingRef.current = true;
      try {
        const { error } = await supabase
          .from('consultations')
          .update({ transcription: JSON.stringify(updatedTranscript) })
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        console.error('Error saving transcript:', error);
      } finally {
        isSavingRef.current = false;
      }
    }, 2000); // Wait 2 seconds after last update before saving
  }, [id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSoapNotesUpdate = (notes: SoapNotes) => {
    setSoapNotes(notes);
  };

  const handleEndConsultation = async () => {
    if (!id) return;

    setIsEndingSession(true);
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ 
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Session Ended",
        description: "Consultation has been marked as completed",
      });

      setConsultationStatus('completed');
      navigate('/queue');
    } catch (error) {
      console.error('Error ending consultation:', error);
      toast({
        title: "Error",
        description: "Failed to end consultation",
        variant: "destructive",
      });
    } finally {
      setIsEndingSession(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Loading...</h2>
      </div>
    );
  }

  const isCompleted = consultationStatus === 'completed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/queue")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Consultation</h2>
            {isCompleted && (
              <Badge className="bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {patientInfo ? `Active session with ${patientInfo.full_name}` : 'Loading patient info...'}
          </p>
        </div>
        
        {!isCompleted && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">End Session</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End Consultation Session?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark the consultation as completed. Make sure all clinical notes have been saved before ending the session.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleEndConsultation}
                  disabled={isEndingSession}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isEndingSession ? "Ending..." : "End Session"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
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
          {/* Patient Uploads from Portal */}
          {patientInfo?.id && (
            <PatientUploadsPanel patientId={patientInfo.id} consultationId={id} />
          )}
          
          <div className="h-[400px]">
            <TranscriptionPanel 
              onTranscriptUpdate={handleTranscriptUpdate} 
              initialTranscripts={transcript}
            />
          </div>
          <div className="h-[600px]">
            <ClinicalNotes 
              transcript={transcript} 
              consultationId={id} 
              onNotesUpdate={handleSoapNotesUpdate}
            />
          </div>
        </div>

        {/* Right Column - Guidelines & Alerts */}
        <div className="h-[1050px]">
          <GuidelinePanel consultationId={id} soapNotes={soapNotes} />
        </div>
      </div>
    </div>
  );
};

export default Consultation;
