import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceRecorder } from "@/components/patient/VoiceRecorder";
import { DocumentUpload } from "@/components/patient/DocumentUpload";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, FileText, Mic, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PatientData {
  id: string;
  full_name: string;
  mrn: string;
  diagnosis: string | null;
}

interface Consultation {
  id: string;
  status: string;
  scheduled_time: string | null;
  chief_complaint: string | null;
}

interface Upload {
  id: string;
  upload_type: string;
  file_name: string | null;
  transcription: string | null;
  summary: string | null;
  created_at: string;
}

export default function PatientPortal() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!user) return;

      try {
        // Fetch patient record linked to this user
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (patientError) {
          if (patientError.code === 'PGRST116') {
            toast({ 
              title: "No patient record found", 
              description: "Please contact the clinic to set up your account",
              variant: "destructive"
            });
          }
          throw patientError;
        }

        setPatient(patientData);

        // Fetch consultations
        const { data: consultationData } = await supabase
          .from('consultations')
          .select('*')
          .eq('patient_id', patientData.id)
          .order('scheduled_time', { ascending: false });

        setConsultations(consultationData || []);

        // Fetch uploads
        const { data: uploadData } = await supabase
          .from('patient_uploads')
          .select('*')
          .eq('patient_id', patientData.id)
          .order('created_at', { ascending: false });

        setUploads(uploadData || []);

      } catch (error: any) {
        console.error("Error fetching patient data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [user, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      waiting: "bg-yellow-500",
      in_progress: "bg-blue-500",
      completed: "bg-green-500",
    };
    return <Badge className={colors[status] || "bg-gray-500"}>{status.replace('_', ' ')}</Badge>;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not scheduled";
    return new Date(dateStr).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="mb-4">No patient record is linked to your account.</p>
            <p className="text-muted-foreground text-sm mb-4">
              Please contact the clinic to set up your patient profile.
            </p>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const upcomingConsultation = consultations.find(c => c.status === 'waiting' || c.status === 'in_progress');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Patient Portal</h1>
            <p className="text-sm text-muted-foreground">Welcome, {patient.full_name}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Patient Info */}
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">MRN</p>
              <p className="font-medium">{patient.mrn}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{patient.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Diagnosis</p>
              <p className="font-medium">{patient.diagnosis || "Not specified"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Consultation */}
        {upcomingConsultation && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Consultation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(upcomingConsultation.scheduled_time)}</span>
                </div>
                {getStatusBadge(upcomingConsultation.status)}
              </div>
              {upcomingConsultation.chief_complaint && (
                <p className="text-sm text-muted-foreground">
                  Chief Complaint: {upcomingConsultation.chief_complaint}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload Section */}
        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice Notes
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="voice" className="mt-4">
            <VoiceRecorder 
              patientId={patient.id} 
              consultationId={upcomingConsultation?.id}
              onUploadComplete={() => {
                // Refresh uploads
                supabase
                  .from('patient_uploads')
                  .select('*')
                  .eq('patient_id', patient.id)
                  .order('created_at', { ascending: false })
                  .then(({ data }) => setUploads(data || []));
              }}
            />
          </TabsContent>
          
          <TabsContent value="documents" className="mt-4">
            <DocumentUpload 
              patientId={patient.id}
              consultationId={upcomingConsultation?.id}
              onUploadComplete={() => {
                supabase
                  .from('patient_uploads')
                  .select('*')
                  .eq('patient_id', patient.id)
                  .order('created_at', { ascending: false })
                  .then(({ data }) => setUploads(data || []));
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Previous Uploads */}
        {uploads.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uploads.map((upload) => (
                  <div key={upload.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {upload.upload_type === 'voice_note' ? (
                          <Mic className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        <span className="font-medium capitalize">
                          {upload.upload_type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(upload.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {upload.file_name && (
                      <p className="text-sm text-muted-foreground mb-1">{upload.file_name}</p>
                    )}
                    {upload.transcription && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <p className="font-medium text-xs mb-1">Transcription:</p>
                        <p className="text-muted-foreground">{upload.transcription}</p>
                      </div>
                    )}
                    {upload.summary && (
                      <div className="mt-2 p-2 bg-primary/10 rounded text-sm">
                        <p className="font-medium text-xs mb-1">AI Summary:</p>
                        <p>{upload.summary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
