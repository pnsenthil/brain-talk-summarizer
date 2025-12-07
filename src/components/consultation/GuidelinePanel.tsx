import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, BookOpen, CheckCircle, Info, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SoapNotes {
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
}

interface GuidelinePanelProps {
  consultationId?: string;
  soapNotes?: SoapNotes;
}

interface ClinicalInsight {
  type: 'warning' | 'guideline' | 'recommendation' | 'info';
  title: string;
  content: string;
}

export const GuidelinePanel = ({ consultationId, soapNotes }: GuidelinePanelProps) => {
  const [insights, setInsights] = useState<ClinicalInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [patientContext, setPatientContext] = useState<any>(null);

  useEffect(() => {
    if (consultationId) {
      fetchPatientContext();
    }
  }, [consultationId]);

  useEffect(() => {
    if (soapNotes && (soapNotes.subjective || soapNotes.assessment || soapNotes.plan)) {
      generateInsights();
    }
  }, [soapNotes]);

  const fetchPatientContext = async () => {
    if (!consultationId) return;

    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          patients (
            full_name,
            diagnosis,
            allergies,
            current_medications
          )
        `)
        .eq('id', consultationId)
        .single();

      if (data?.patients) {
        setPatientContext(data.patients);
      }
    } catch (error) {
      console.error('Error fetching patient context:', error);
    }
  };

  const generateInsights = async () => {
    if (!soapNotes) return;

    setIsLoading(true);
    const generatedInsights: ClinicalInsight[] = [];

    // Analyze subjective for key symptoms
    if (soapNotes.subjective) {
      const subjective = soapNotes.subjective.toLowerCase();
      
      if (subjective.includes('seizure') || subjective.includes('convulsion')) {
        generatedInsights.push({
          type: 'guideline',
          title: 'ILAE Seizure Management',
          content: 'Consider seizure frequency, duration, and triggers. Verify medication adherence and review anti-seizure medication levels if applicable.',
        });
      }

      if (subjective.includes('headache') || subjective.includes('migraine')) {
        generatedInsights.push({
          type: 'guideline',
          title: 'Headache Assessment',
          content: 'Assess for red flags: sudden onset, worst headache ever, neurological deficits. Consider imaging if new or changed pattern.',
        });
      }

      if (subjective.includes('sleep') || subjective.includes('insomnia')) {
        generatedInsights.push({
          type: 'info',
          title: 'Sleep Impact',
          content: 'Sleep disruption can affect seizure threshold and medication efficacy. Consider sleep hygiene counseling.',
        });
      }
    }

    // Analyze assessment for drug interactions
    if (soapNotes.assessment) {
      const assessment = soapNotes.assessment.toLowerCase();
      
      if (assessment.includes('medication') || assessment.includes('drug')) {
        if (patientContext?.current_medications) {
          generatedInsights.push({
            type: 'warning',
            title: 'Medication Review Required',
            content: 'Patient has existing medications. Check for potential drug interactions before prescribing new medications.',
          });
        }
      }
    }

    // Analyze plan for recommendations
    if (soapNotes.plan) {
      const plan = soapNotes.plan.toLowerCase();
      
      if (plan.includes('follow') || plan.includes('return')) {
        generatedInsights.push({
          type: 'recommendation',
          title: 'Follow-up Scheduling',
          content: 'Ensure follow-up appointment is scheduled and patient understands return precautions.',
        });
      }

      if (plan.includes('lab') || plan.includes('blood') || plan.includes('test')) {
        generatedInsights.push({
          type: 'info',
          title: 'Lab Orders',
          content: 'Verify lab orders are placed and patient understands fasting requirements if applicable.',
        });
      }
    }

    // Add allergies warning if present
    if (patientContext?.allergies && patientContext.allergies.length > 0) {
      generatedInsights.push({
        type: 'warning',
        title: 'Allergy Alert',
        content: `Patient has documented allergies: ${patientContext.allergies.join(', ')}. Verify any new prescriptions.`,
      });
    }

    setInsights(generatedInsights);
    setIsLoading(false);
  };

  const hasSOAPContent = soapNotes && (soapNotes.subjective || soapNotes.objective || soapNotes.assessment || soapNotes.plan);

  return (
    <Card className="p-6 h-full flex flex-col">
      <h3 className="font-semibold text-lg mb-4">Clinical Decision Support</h3>

      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {/* Show loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-medical-blue" />
              <span className="ml-2 text-sm text-muted-foreground">Analyzing clinical notes...</span>
            </div>
          )}

          {/* Show placeholder when no SOAP notes */}
          {!hasSOAPContent && !isLoading && (
            <Alert className="border-border bg-muted/30">
              <Info className="h-4 w-4 text-muted-foreground" />
              <AlertTitle className="font-semibold">Awaiting Clinical Notes</AlertTitle>
              <AlertDescription className="text-sm mt-2">
                Clinical decision support will appear here once SOAP notes are generated. 
                Start recording the consultation and generate notes to receive AI-powered insights.
              </AlertDescription>
            </Alert>
          )}

          {/* Show generated insights */}
          {insights.map((insight, index) => {
            const getAlertStyle = () => {
              switch (insight.type) {
                case 'warning':
                  return { 
                    variant: 'destructive' as const, 
                    className: 'border-alert-red bg-alert-red/10',
                    icon: <AlertTriangle className="h-4 w-4" />,
                    titleClass: 'text-alert-red'
                  };
                case 'guideline':
                  return { 
                    variant: 'default' as const, 
                    className: 'border-medical-blue bg-medical-blue/5',
                    icon: <BookOpen className="h-4 w-4 text-medical-blue" />,
                    titleClass: 'text-medical-blue'
                  };
                case 'recommendation':
                  return { 
                    variant: 'default' as const, 
                    className: 'border-success bg-success/5',
                    icon: <CheckCircle className="h-4 w-4 text-success" />,
                    titleClass: 'text-success'
                  };
                default:
                  return { 
                    variant: 'default' as const, 
                    className: 'border-border bg-muted/30',
                    icon: <Info className="h-4 w-4 text-medical-teal" />,
                    titleClass: 'text-foreground'
                  };
              }
            };

            const style = getAlertStyle();

            return (
              <Alert key={index} className={style.className}>
                {style.icon}
                <AlertTitle className={`font-semibold ${style.titleClass}`}>{insight.title}</AlertTitle>
                <AlertDescription className="text-sm mt-2">
                  {insight.content}
                </AlertDescription>
              </Alert>
            );
          })}

          {/* Patient Context if available */}
          {patientContext && hasSOAPContent && (
            <Alert className="border-border bg-muted/30">
              <Info className="h-4 w-4 text-medical-teal" />
              <AlertTitle className="font-semibold">Patient Context</AlertTitle>
              <AlertDescription className="text-sm mt-2">
                <div className="space-y-1">
                  <p><span className="font-medium">Name:</span> {patientContext.full_name}</p>
                  {patientContext.diagnosis && (
                    <p><span className="font-medium">Diagnosis:</span> {patientContext.diagnosis}</p>
                  )}
                  {patientContext.allergies && patientContext.allergies.length > 0 && (
                    <p><span className="font-medium">Allergies:</span> {patientContext.allergies.join(', ')}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {hasSOAPContent && insights.length > 0 && (
            <div className="pt-4 border-t">
              <Badge variant="outline" className="text-xs">
                AI-Generated Insights • Based on SOAP Notes
              </Badge>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
