import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Mic, ExternalLink, Edit2, Save, Loader2 } from "lucide-react";

interface Upload {
  id: string;
  upload_type: string;
  file_url: string | null;
  file_name: string | null;
  transcription: string | null;
  summary: string | null;
  created_at: string;
}

interface PatientUploadsPanelProps {
  patientId: string;
  consultationId?: string;
}

export function PatientUploadsPanel({ patientId, consultationId }: PatientUploadsPanelProps) {
  const { toast } = useToast();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTranscription, setEditedTranscription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        let query = supabase
          .from('patient_uploads')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });

        if (consultationId) {
          query = query.or(`consultation_id.eq.${consultationId},consultation_id.is.null`);
        }

        const { data, error } = await query;
        if (error) throw error;
        setUploads(data || []);
      } catch (error) {
        console.error("Error fetching uploads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUploads();
  }, [patientId, consultationId]);

  const handleEdit = (upload: Upload) => {
    setEditingId(upload.id);
    setEditedTranscription(upload.transcription || "");
  };

  const handleSave = async (uploadId: string) => {
    setIsSaving(true);
    try {
      // Generate new summary from edited transcription
      const { data: summaryData } = await supabase.functions
        .invoke('generate-summary', {
          body: { transcription: editedTranscription, type: 'summary' }
        });

      const { error } = await supabase
        .from('patient_uploads')
        .update({ 
          transcription: editedTranscription,
          summary: summaryData?.summary 
        })
        .eq('id', uploadId);

      if (error) throw error;

      setUploads(prev => prev.map(u => 
        u.id === uploadId 
          ? { ...u, transcription: editedTranscription, summary: summaryData?.summary }
          : u
      ));
      setEditingId(null);
      toast({ title: "Saved", description: "Transcription updated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading patient uploads...</p>
        </CardContent>
      </Card>
    );
  }

  if (uploads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Patient Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No uploads from patient yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Patient Pre-Consultation Materials
          <Badge variant="secondary">{uploads.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploads.map((upload) => (
          <div key={upload.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {upload.upload_type === 'voice_note' ? (
                  <Mic className="h-4 w-4 text-primary" />
                ) : (
                  <FileText className="h-4 w-4 text-primary" />
                )}
                <span className="font-medium capitalize">
                  {upload.upload_type.replace('_', ' ')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(upload.created_at).toLocaleString()}
                </span>
              </div>
              {upload.file_url && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={upload.file_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>

            {upload.file_name && upload.upload_type !== 'voice_note' && (
              <p className="text-sm text-muted-foreground">{upload.file_name}</p>
            )}

            {upload.upload_type === 'voice_note' && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Transcription</label>
                    {editingId !== upload.id ? (
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(upload)}>
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSave(upload.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3 mr-1" />
                        )}
                        Save
                      </Button>
                    )}
                  </div>
                  {editingId === upload.id ? (
                    <Textarea
                      value={editedTranscription}
                      onChange={(e) => setEditedTranscription(e.target.value)}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded text-sm">
                      {upload.transcription || "No transcription available"}
                    </div>
                  )}
                </div>

                {upload.summary && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">AI Summary</label>
                    <div className="p-3 bg-primary/10 rounded text-sm">
                      {upload.summary}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
