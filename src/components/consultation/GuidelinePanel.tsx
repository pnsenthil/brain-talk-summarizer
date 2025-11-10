import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, BookOpen, CheckCircle, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const GuidelinePanel = () => {
  return (
    <Card className="p-6 h-full flex flex-col">
      <h3 className="font-semibold text-lg mb-4">Clinical Decision Support</h3>

      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {/* Drug Safety Alert */}
          <Alert variant="destructive" className="border-alert-red bg-alert-red/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-semibold">Drug Interaction Warning</AlertTitle>
            <AlertDescription className="text-sm mt-2">
              Potential interaction detected between Levetiracetam and current medications. 
              Review patient's complete medication list before prescribing.
            </AlertDescription>
          </Alert>

          {/* Clinical Guideline */}
          <Alert className="border-medical-blue bg-medical-blue/5">
            <BookOpen className="h-4 w-4 text-medical-blue" />
            <AlertTitle className="font-semibold text-medical-blue">ILAE Guideline</AlertTitle>
            <AlertDescription className="text-sm mt-2">
              <p className="mb-2">For focal onset seizures with frequency increase:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Consider dosage adjustment before adding new ASM</li>
                <li>Verify medication adherence</li>
                <li>Rule out precipitating factors (sleep, stress)</li>
                <li>EEG monitoring recommended if pattern changes</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Best Practice */}
          <Alert className="border-success bg-success/5">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertTitle className="font-semibold text-success">Best Practice</AlertTitle>
            <AlertDescription className="text-sm mt-2">
              Patient meets criteria for medication adjustment. Current seizure frequency 
              suggests suboptimal control. Consider titration protocol.
            </AlertDescription>
          </Alert>

          {/* Additional Info */}
          <Alert className="border-border bg-muted/30">
            <Info className="h-4 w-4 text-medical-teal" />
            <AlertTitle className="font-semibold">Patient Context</AlertTitle>
            <AlertDescription className="text-sm mt-2">
              <div className="space-y-1">
                <p><span className="font-medium">Diagnosis:</span> Focal Onset Epilepsy</p>
                <p><span className="font-medium">Duration:</span> 3 years</p>
                <p><span className="font-medium">Current ASM:</span> Levetiracetam 1000mg BID</p>
                <p><span className="font-medium">Last Seizure:</span> 2 days ago</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Relevant Studies */}
          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-medical-teal" />
              Relevant Research
            </h4>
            <div className="space-y-2 text-sm">
              <div className="pb-2 border-b">
                <p className="font-medium text-foreground">Levetiracetam Efficacy Study</p>
                <p className="text-xs text-muted-foreground">NEJM 2024 • 78% seizure reduction at 1500mg BID</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Sleep and Seizure Correlation</p>
                <p className="text-xs text-muted-foreground">Epilepsia 2023 • Strong correlation identified</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Badge variant="outline" className="text-xs">
              Guidelines updated: Jan 2024
            </Badge>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
};
