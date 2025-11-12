import { PatientQueueCard } from "@/components/queue/PatientQueueCard";
import { PatientRegistrationDialog } from "@/components/queue/PatientRegistrationDialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Queue = () => {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from("consultations")
        .select(`
          *,
          patients (*),
          triage_forms (*)
        `)
        .in("status", ["waiting", "ready", "in_progress"])
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading queue",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = (consultationId: string) => {
    navigate(`/consultation/${consultationId}`);
  };

  const patients = consultations.map(c => ({
    id: c.id,
    name: c.patients.full_name,
    age: new Date().getFullYear() - new Date(c.patients.date_of_birth).getFullYear(),
    gender: c.patients.gender,
    appointmentTime: new Date(c.scheduled_time).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }),
    status: c.status === "in_progress" ? "in-progress" : c.status,
    triageComplete: c.triage_forms?.length > 0 && c.triage_forms[0].completed,
    priority: c.priority,
    estimatedDelay: 0,
    consultationId: c.id,
    patientId: c.patient_id,
  }));

  const stats = {
    total: patients.length,
    waiting: patients.filter(p => p.status === "waiting").length,
    avgWaitTime: 22,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Patient Queue</h2>
          <p className="text-muted-foreground mt-1">Manage today's consultations</p>
        </div>
        <div className="flex gap-2">
          <PatientRegistrationDialog onPatientAdded={loadConsultations} />
          <Button variant="outline" size="sm" onClick={loadConsultations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-medical-blue p-3">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-warning p-3">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Waiting</p>
              <p className="text-2xl font-bold text-foreground">{stats.waiting}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-medical-teal p-3">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Wait Time</p>
              <p className="text-2xl font-bold text-foreground">{stats.avgWaitTime} min</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Badges */}
      <div className="flex gap-2">
        <Badge variant="outline" className="cursor-pointer hover:bg-secondary">All ({patients.length})</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-secondary">Waiting ({stats.waiting})</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-secondary">Ready</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-secondary">In Progress</Badge>
      </div>

      {/* Patient Queue */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">
            Loading patients...
          </Card>
        ) : patients.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No patients in queue. Register a new patient to get started.
          </Card>
        ) : (
          patients.map(patient => (
            <PatientQueueCard
              key={patient.id}
              patient={patient}
              onStartConsultation={handleStartConsultation}
              onTriageComplete={loadConsultations}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Queue;
