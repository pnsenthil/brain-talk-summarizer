import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, User, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Consultation {
  id: string;
  patient_id: string;
  scheduled_time: string;
  status: string;
  chief_complaint: string | null;
  patients: {
    full_name: string;
    diagnosis: string | null;
  } | null;
}

const Consultations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const { data, error } = await supabase
          .from('consultations')
          .select(`
            id,
            patient_id,
            scheduled_time,
            status,
            chief_complaint,
            patients (
              full_name,
              diagnosis
            )
          `)
          .order('scheduled_time', { ascending: false });

        if (error) throw error;
        setConsultations(data || []);
      } catch (error) {
        console.error('Error fetching consultations:', error);
        toast({
          title: "Error",
          description: "Failed to load consultations",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultations();
  }, [toast]);

  const filteredConsultations = consultations.filter((consultation) => {
    const matchesSearch = 
      consultation.patients?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultation.patients?.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultation.chief_complaint?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || consultation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "in_progress":
        return "bg-warning text-warning-foreground";
      case "waiting":
        return "bg-info text-info-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Consultations</h2>
          <p className="text-muted-foreground mt-1">Loading consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Consultations</h2>
        <p className="text-muted-foreground mt-1">View and manage patient consultations</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name, diagnosis, or complaint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {filteredConsultations.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No consultations found</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredConsultations.map((consultation) => {
            const dateTime = formatDateTime(consultation.scheduled_time);
            return (
              <Card key={consultation.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-medical-blue/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-medical-blue" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {consultation.patients?.full_name || 'Unknown Patient'}
                        </h3>
                        <Badge className={getStatusColor(consultation.status)}>
                          {consultation.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {consultation.chief_complaint || consultation.patients?.diagnosis || 'No diagnosis recorded'}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {dateTime.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {dateTime.time}
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Consultations;
