import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, User } from "lucide-react";

const mockConsultations = [
  {
    id: "1",
    patientName: "Emma Wilson",
    date: "2024-01-15",
    time: "09:30 AM",
    diagnosis: "Focal Onset Epilepsy",
    status: "completed",
  },
  {
    id: "2",
    patientName: "John Smith",
    date: "2024-01-15",
    time: "10:45 AM",
    diagnosis: "Generalized Epilepsy",
    status: "completed",
  },
  {
    id: "3",
    patientName: "Sarah Johnson",
    date: "2024-01-15",
    time: "02:00 PM",
    diagnosis: "Absence Seizures",
    status: "in-progress",
  },
];

const Consultations = () => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "in-progress":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Consultations</h2>
        <p className="text-muted-foreground mt-1">View and manage patient consultations</p>
      </div>

      <div className="grid gap-4">
        {mockConsultations.map((consultation) => (
          <Card key={consultation.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-full bg-medical-blue/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-medical-blue" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {consultation.patientName}
                    </h3>
                    <Badge className={getStatusColor(consultation.status)}>
                      {consultation.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {consultation.diagnosis}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {consultation.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {consultation.time}
                    </div>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => navigate(`/consultation/${consultation.id}`)}
                variant="outline"
              >
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Consultations;
