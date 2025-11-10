import { PatientQueueCard } from "@/components/queue/PatientQueueCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const mockPatients = [
  {
    id: "1",
    name: "Emma Wilson",
    age: 34,
    gender: "F",
    appointmentTime: "09:30",
    status: "in-progress" as const,
    triageComplete: true,
    priority: "routine" as const,
    estimatedDelay: 0,
  },
  {
    id: "2",
    name: "Michael Brown",
    age: 45,
    gender: "M",
    appointmentTime: "10:00",
    status: "ready" as const,
    triageComplete: true,
    priority: "urgent" as const,
    estimatedDelay: 15,
  },
  {
    id: "3",
    name: "Sarah Johnson",
    age: 28,
    gender: "F",
    appointmentTime: "10:30",
    status: "waiting" as const,
    triageComplete: false,
    priority: "routine" as const,
    estimatedDelay: 30,
  },
  {
    id: "4",
    name: "Robert Davis",
    age: 52,
    gender: "M",
    appointmentTime: "11:00",
    status: "waiting" as const,
    triageComplete: true,
    priority: "routine" as const,
    estimatedDelay: 45,
  },
];

const Queue = () => {
  const [patients] = useState(mockPatients);
  const navigate = useNavigate();

  const handleStartConsultation = (patientId: string) => {
    navigate(`/consultation/${patientId}`);
  };

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
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
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
        {patients.map(patient => (
          <PatientQueueCard
            key={patient.id}
            patient={patient}
            onStartConsultation={handleStartConsultation}
          />
        ))}
      </div>
    </div>
  );
};

export default Queue;
