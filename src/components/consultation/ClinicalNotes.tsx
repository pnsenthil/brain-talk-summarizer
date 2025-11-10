import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Save, Copy } from "lucide-react";
import { useState } from "react";

export const ClinicalNotes = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Clinical Documentation</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Auto-Generate"}
          </Button>
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button size="sm" className="bg-success hover:bg-success/90">
            <Save className="h-4 w-4 mr-2" />
            Save Note
          </Button>
        </div>
      </div>

      <Tabs defaultValue="soap" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="soap">SOAP</TabsTrigger>
          <TabsTrigger value="prescription">Prescription</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="followup">Follow-up</TabsTrigger>
        </TabsList>

        <TabsContent value="soap" className="flex-1 space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">S</Badge>
              <label className="text-sm font-medium">Subjective</label>
            </div>
            <Textarea 
              placeholder="Patient's chief complaint and history..."
              className="min-h-[100px] resize-none"
              defaultValue="Patient reports increased seizure frequency (3-4 episodes this week), primarily occurring in the morning hours. Patient notes possible correlation with sleep disruption."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">O</Badge>
              <label className="text-sm font-medium">Objective</label>
            </div>
            <Textarea 
              placeholder="Physical examination findings..."
              className="min-h-[100px] resize-none"
              defaultValue="Vital signs stable. Neurological examination unremarkable. Alert and oriented x3. No focal deficits noted."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">A</Badge>
              <label className="text-sm font-medium">Assessment</label>
            </div>
            <Textarea 
              placeholder="Diagnosis and clinical impression..."
              className="min-h-[80px] resize-none"
              defaultValue="Focal onset epilepsy with increased seizure frequency. Possible medication non-compliance or breakthrough seizures despite current regimen."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">P</Badge>
              <label className="text-sm font-medium">Plan</label>
            </div>
            <Textarea 
              placeholder="Treatment plan and recommendations..."
              className="min-h-[100px] resize-none"
              defaultValue="1. Adjust levetiracetam dosage to 1500mg BID&#10;2. Order EEG to assess seizure activity&#10;3. Sleep hygiene counseling&#10;4. Follow-up in 2 weeks"
            />
          </div>
        </TabsContent>

        <TabsContent value="prescription" className="flex-1 mt-4">
          <p className="text-sm text-muted-foreground">Prescription management will be available here</p>
        </TabsContent>

        <TabsContent value="orders" className="flex-1 mt-4">
          <p className="text-sm text-muted-foreground">Lab orders and tests will be available here</p>
        </TabsContent>

        <TabsContent value="followup" className="flex-1 mt-4">
          <p className="text-sm text-muted-foreground">Follow-up scheduling will be available here</p>
        </TabsContent>
      </Tabs>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            AI-assisted by <span className="font-semibold text-medical-teal">MedLM</span>
          </span>
          <span className="text-muted-foreground">Last saved: 2 minutes ago</span>
        </div>
      </div>
    </Card>
  );
};
