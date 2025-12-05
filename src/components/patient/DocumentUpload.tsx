import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DocumentUploadProps {
  patientId: string;
  consultationId?: string;
  onUploadComplete?: (uploadId: string) => void;
}

interface UploadedDocument {
  id: string;
  file_name: string;
  upload_type: string;
  created_at: string;
}

export function DocumentUpload({ patientId, consultationId, onUploadComplete }: DocumentUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<string>("medical_report");
  const [uploads, setUploads] = useState<UploadedDocument[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: "Invalid file type", 
        description: "Please upload PDF or image files only", 
        variant: "destructive" 
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ 
        title: "File too large", 
        description: "Maximum file size is 10MB", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('patient-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('patient-uploads')
        .getPublicUrl(fileName);

      // Save to database
      const { data: uploadRecord, error: dbError } = await supabase
        .from('patient_uploads')
        .insert({
          patient_id: patientId,
          consultation_id: consultationId,
          upload_type: uploadType,
          file_url: publicUrl,
          file_name: file.name,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploads(prev => [...prev, uploadRecord as UploadedDocument]);
      toast({ title: "Success", description: "Document uploaded successfully" });
      onUploadComplete?.(uploadRecord.id);

      // Reset file input
      event.target.value = '';

    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to upload document", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (uploadId: string) => {
    try {
      const { error } = await supabase
        .from('patient_uploads')
        .delete()
        .eq('id', uploadId);

      if (error) throw error;

      setUploads(prev => prev.filter(u => u.id !== uploadId));
      toast({ title: "Deleted", description: "Document removed" });

    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Document Type</Label>
          <Select value={uploadType} onValueChange={setUploadType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="medical_report">Medical Report</SelectItem>
              <SelectItem value="prescription">Earlier Prescription</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Select File</Label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="flex-1"
            />
            {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <p className="text-xs text-muted-foreground">
            Supported formats: PDF, JPG, PNG (max 10MB)
          </p>
        </div>

        {uploads.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded Documents</Label>
            <div className="space-y-2">
              {uploads.map((upload) => (
                <div 
                  key={upload.id} 
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm truncate max-w-[200px]">{upload.file_name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      ({upload.upload_type.replace('_', ' ')})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(upload.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
