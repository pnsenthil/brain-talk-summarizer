import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TriageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultationId: string;
  patientId: string;
  onComplete?: () => void;
}

const TRIGGER_OPTIONS = [
  "Stress",
  "Lack of sleep",
  "Missed medication",
  "Bright lights",
  "Alcohol",
  "Caffeine",
  "Hormonal changes",
  "Other"
];

export const TriageFormDialog = ({ open, onOpenChange, consultationId, patientId, onComplete }: TriageFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [existingTriage, setExistingTriage] = useState<any>(null);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && consultationId) {
      loadExistingTriage();
    }
  }, [open, consultationId]);

  const loadExistingTriage = async () => {
    const { data } = await supabase
      .from("triage_forms")
      .select("*")
      .eq("consultation_id", consultationId)
      .maybeSingle();

    if (data) {
      setExistingTriage(data);
      setSelectedTriggers(data.triggers || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const triageData = {
        patient_id: patientId,
        consultation_id: consultationId,
        nurse_id: user?.id,
        seizure_frequency: formData.get("seizure_frequency") as string,
        last_seizure_date: formData.get("last_seizure_date") as string,
        seizure_duration: formData.get("seizure_duration") as string,
        medication_compliance: formData.get("medication_compliance") as string,
        side_effects: formData.get("side_effects") as string,
        triggers: selectedTriggers,
        sleep_quality: formData.get("sleep_quality") as string,
        stress_level: formData.get("stress_level") as string,
        additional_notes: formData.get("additional_notes") as string,
        completed: true,
      };

      if (existingTriage) {
        const { error } = await supabase
          .from("triage_forms")
          .update(triageData)
          .eq("id", existingTriage.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("triage_forms")
          .insert(triageData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Triage form saved successfully",
      });

      onOpenChange(false);
      onComplete?.();
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

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev =>
      prev.includes(trigger)
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Epilepsy Triage Form</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seizure_frequency">Seizure Frequency</Label>
              <Input
                id="seizure_frequency"
                name="seizure_frequency"
                defaultValue={existingTriage?.seizure_frequency}
                placeholder="e.g., 2-3 per month"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_seizure_date">Last Seizure Date</Label>
              <Input
                id="last_seizure_date"
                name="last_seizure_date"
                type="date"
                defaultValue={existingTriage?.last_seizure_date}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seizure_duration">Typical Seizure Duration</Label>
            <Input
              id="seizure_duration"
              name="seizure_duration"
              defaultValue={existingTriage?.seizure_duration}
              placeholder="e.g., 1-2 minutes"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medication_compliance">Medication Compliance</Label>
            <Select name="medication_compliance" defaultValue={existingTriage?.medication_compliance}>
              <SelectTrigger>
                <SelectValue placeholder="Select compliance level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent - Never miss</SelectItem>
                <SelectItem value="good">Good - Rarely miss</SelectItem>
                <SelectItem value="fair">Fair - Sometimes miss</SelectItem>
                <SelectItem value="poor">Poor - Frequently miss</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="side_effects">Current Side Effects</Label>
            <Textarea
              id="side_effects"
              name="side_effects"
              defaultValue={existingTriage?.side_effects}
              placeholder="List any medication side effects"
            />
          </div>

          <div className="space-y-2">
            <Label>Known Triggers</Label>
            <div className="grid grid-cols-2 gap-3">
              {TRIGGER_OPTIONS.map((trigger) => (
                <div key={trigger} className="flex items-center space-x-2">
                  <Checkbox
                    id={`trigger-${trigger}`}
                    checked={selectedTriggers.includes(trigger)}
                    onCheckedChange={() => toggleTrigger(trigger)}
                  />
                  <label
                    htmlFor={`trigger-${trigger}`}
                    className="text-sm cursor-pointer"
                  >
                    {trigger}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sleep_quality">Sleep Quality</Label>
              <Select name="sleep_quality" defaultValue={existingTriage?.sleep_quality}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stress_level">Stress Level</Label>
              <Select name="stress_level" defaultValue={existingTriage?.stress_level}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional_notes">Additional Notes</Label>
            <Textarea
              id="additional_notes"
              name="additional_notes"
              defaultValue={existingTriage?.additional_notes}
              placeholder="Any other relevant information"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Triage Form"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
