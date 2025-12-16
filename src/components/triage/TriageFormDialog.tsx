import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTriageTemplate, useTriageTemplates } from "@/hooks/useTriageTemplate";
import { TriageFieldRenderer } from "./TriageFieldRenderer";
import { Loader2 } from "lucide-react";

interface TriageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultationId: string;
  patientId: string;
  specialty?: string;
  onComplete?: () => void;
}

export const TriageFormDialog = ({ 
  open, 
  onOpenChange, 
  consultationId, 
  patientId, 
  specialty,
  onComplete 
}: TriageFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [existingTriage, setExistingTriage] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [commonFields, setCommonFields] = useState({
    sleep_quality: "",
    stress_level: "",
    additional_notes: "",
  });
  const { toast } = useToast();

  const { templates, loading: templatesLoading } = useTriageTemplates();
  const { template, loading: templateLoading } = useTriageTemplate(
    selectedTemplateId || undefined,
    !selectedTemplateId ? specialty : undefined
  );

  useEffect(() => {
    if (open && consultationId) {
      loadExistingTriage();
    }
  }, [open, consultationId]);

  useEffect(() => {
    if (template && !selectedTemplateId) {
      setSelectedTemplateId(template.id);
    }
  }, [template]);

  const loadExistingTriage = async () => {
    const { data } = await supabase
      .from("triage_forms")
      .select("*")
      .eq("consultation_id", consultationId)
      .maybeSingle();

    if (data) {
      setExistingTriage(data);
      setFormData((data.form_data as Record<string, any>) || {});
      setCommonFields({
        sleep_quality: data.sleep_quality || "",
        stress_level: data.stress_level || "",
        additional_notes: data.additional_notes || "",
      });
      if (data.template_id) {
        setSelectedTemplateId(data.template_id);
      }
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    try {
      const triageData = {
        patient_id: patientId,
        consultation_id: consultationId,
        nurse_id: user?.id,
        template_id: selectedTemplateId,
        form_data: formData,
        sleep_quality: commonFields.sleep_quality,
        stress_level: commonFields.stress_level,
        additional_notes: commonFields.additional_notes,
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

  const isLoading = templatesLoading || templateLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? `${template.name} Triage Form` : "Triage Form"}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Template Selector */}
            <div className="space-y-2">
              <Label>Triage Template</Label>
              <Select 
                value={selectedTemplateId} 
                onValueChange={(id) => {
                  setSelectedTemplateId(id);
                  setFormData({});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select triage template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Template Fields */}
            {template && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {template.fields.map((field) => (
                  <div 
                    key={field.key} 
                    className={field.type === "checkbox_group" || field.type === "textarea" ? "md:col-span-2" : ""}
                  >
                    <TriageFieldRenderer
                      field={field}
                      value={formData[field.key]}
                      onChange={handleFieldChange}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Common Fields */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">General Assessment</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sleep_quality">Sleep Quality</Label>
                  <Select 
                    value={commonFields.sleep_quality} 
                    onValueChange={(v) => setCommonFields(prev => ({ ...prev, sleep_quality: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stress_level">Stress Level</Label>
                  <Select 
                    value={commonFields.stress_level} 
                    onValueChange={(v) => setCommonFields(prev => ({ ...prev, stress_level: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  value={commonFields.additional_notes}
                  onChange={(e) => setCommonFields(prev => ({ ...prev, additional_notes: e.target.value }))}
                  placeholder="Any other relevant information"
                  rows={4}
                />
              </div>
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
        )}
      </DialogContent>
    </Dialog>
  );
};
