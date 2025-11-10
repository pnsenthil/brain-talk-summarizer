import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  appointmentTime: string;
  status: "waiting" | "ready" | "in-progress";
  triageComplete: boolean;
  priority: "routine" | "urgent" | "emergency";
  estimatedDelay: number;
}

interface PatientQueueCardProps {
  patient: Patient;
  onStartConsultation: (id: string) => void;
}

export const PatientQueueCard = ({ patient, onStartConsultation }: PatientQueueCardProps) => {
  const statusColors = {
    waiting: "bg-muted text-muted-foreground",
    ready: "bg-success text-success-foreground",
    "in-progress": "bg-primary text-primary-foreground",
  };

  const priorityColors = {
    routine: "bg-muted text-muted-foreground",
    urgent: "bg-warning text-warning-foreground",
    emergency: "bg-destructive text-destructive-foreground",
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg text-foreground">{patient.name}</h3>
            <Badge className={priorityColors[patient.priority]}>
              {patient.priority}
            </Badge>
            <Badge className={statusColors[patient.status]}>
              {patient.status.replace("-", " ")}
            </Badge>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>{patient.age}y, {patient.gender}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {patient.appointmentTime}
            </span>
            {patient.estimatedDelay > 0 && (
              <span className="flex items-center gap-1 text-warning">
                <AlertTriangle className="h-4 w-4" />
                +{patient.estimatedDelay} min delay
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {patient.triageComplete ? (
              <span className="flex items-center gap-1 text-sm text-success">
                <CheckCircle className="h-4 w-4" />
                Triage completed
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-warning">
                <AlertTriangle className="h-4 w-4" />
                Triage pending
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
          >
            View Triage
          </Button>
          <Button
            onClick={() => onStartConsultation(patient.id)}
            disabled={patient.status === "in-progress"}
          >
            Start Consultation
          </Button>
        </div>
      </div>
    </Card>
  );
};
