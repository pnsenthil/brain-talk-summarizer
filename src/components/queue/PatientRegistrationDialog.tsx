import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";

export const PatientRegistrationDialog = ({ onPatientAdded }: { onPatientAdded?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      // Generate MRN
      const mrn = `MRN${Date.now().toString().slice(-8)}`;

      // Insert patient
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .insert({
          mrn,
          full_name: formData.get("full_name") as string,
          date_of_birth: formData.get("date_of_birth") as string,
          gender: formData.get("gender") as string,
          phone: formData.get("phone") as string,
          email: formData.get("email") as string,
          address: formData.get("address") as string,
          allergies: (formData.get("allergies") as string)?.split(",").map(a => a.trim()).filter(Boolean),
          emergency_contact_name: formData.get("emergency_contact_name") as string,
          emergency_contact_phone: formData.get("emergency_contact_phone") as string,
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Create consultation
      const { error: consultationError } = await supabase
        .from("consultations")
        .insert({
          patient_id: patient.id,
          chief_complaint: formData.get("chief_complaint") as string,
          visit_type: "Follow-up",
          status: "waiting",
          priority: "routine",
          scheduled_time: new Date().toISOString(),
        });

      if (consultationError) throw consultationError;

      toast({
        title: "Success",
        description: "Patient registered successfully",
      });

      setOpen(false);
      e.currentTarget.reset();
      onPatientAdded?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Register Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Patient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input id="date_of_birth" name="date_of_birth" type="date" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select name="gender">
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies (comma separated)</Label>
            <Input id="allergies" name="allergies" placeholder="e.g., Penicillin, Aspirin" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
              <Input id="emergency_contact_name" name="emergency_contact_name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
              <Input id="emergency_contact_phone" name="emergency_contact_phone" type="tel" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chief_complaint">Chief Complaint *</Label>
            <Textarea id="chief_complaint" name="chief_complaint" required placeholder="Reason for visit" />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register Patient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
