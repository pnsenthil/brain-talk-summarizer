import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TranscriptionPanel } from "@/components/consultation/TranscriptionPanel";
import { ClinicalNotes } from "@/components/consultation/ClinicalNotes";
import { GuidelinePanel } from "@/components/consultation/GuidelinePanel";
import { ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Consultation = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/queue")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Consultation</h2>
          <p className="text-muted-foreground mt-1">Active session with Emma Wilson</p>
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
              <p className="font-semibold text-foreground">Emma Wilson</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Age / Gender</p>
              <p className="font-semibold text-foreground">34 / Female</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Diagnosis</p>
              <p className="font-semibold text-foreground">Focal Onset Epilepsy</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Visit</p>
              <p className="font-semibold text-foreground">2 weeks ago</p>
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
            <TranscriptionPanel />
          </div>
          <div className="h-[600px]">
            <ClinicalNotes />
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
