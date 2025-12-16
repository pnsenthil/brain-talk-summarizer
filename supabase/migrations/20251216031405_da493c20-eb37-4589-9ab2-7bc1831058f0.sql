-- Create triage_templates table for configurable specialty-specific fields
CREATE TABLE public.triage_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text NOT NULL,
  fields jsonb NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.triage_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can view templates
CREATE POLICY "Anyone can view triage templates" ON public.triage_templates
  FOR SELECT USING (true);

-- Only admins can manage templates
CREATE POLICY "Admins can manage triage templates" ON public.triage_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add template_id and form_data columns to triage_forms
ALTER TABLE public.triage_forms 
  ADD COLUMN template_id uuid REFERENCES public.triage_templates(id),
  ADD COLUMN form_data jsonb DEFAULT '{}'::jsonb;

-- Update RLS policies to allow doctors to create/update triage forms
DROP POLICY IF EXISTS "Nurses can create triage forms" ON public.triage_forms;
CREATE POLICY "Staff can create triage forms" ON public.triage_forms
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'doctor'::app_role) OR 
    has_role(auth.uid(), 'nurse'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Nurses can update triage forms" ON public.triage_forms;
CREATE POLICY "Staff can update triage forms" ON public.triage_forms
  FOR UPDATE USING (
    has_role(auth.uid(), 'doctor'::app_role) OR 
    has_role(auth.uid(), 'nurse'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Seed default triage templates
INSERT INTO public.triage_templates (name, specialty, fields, is_default) VALUES
(
  'General Medicine',
  'general',
  '[
    {"key": "chief_complaint_severity", "label": "Chief Complaint Severity", "type": "select", "options": ["Mild", "Moderate", "Severe", "Critical"]},
    {"key": "pain_scale", "label": "Pain Scale (0-10)", "type": "slider", "min": 0, "max": 10},
    {"key": "vital_signs_abnormal", "label": "Abnormal Vital Signs", "type": "checkbox_group", "options": ["High BP", "Low BP", "Tachycardia", "Bradycardia", "Fever", "Hypothermia", "Tachypnea", "Low O2 Sat"]},
    {"key": "symptom_duration", "label": "Symptom Duration", "type": "select", "options": ["< 24 hours", "1-3 days", "4-7 days", "1-2 weeks", "> 2 weeks"]},
    {"key": "medication_compliance", "label": "Medication Compliance", "type": "select", "options": ["Fully compliant", "Mostly compliant", "Partially compliant", "Non-compliant", "Not applicable"]}
  ]'::jsonb,
  true
),
(
  'Neurology / Epilepsy',
  'neurology',
  '[
    {"key": "seizure_frequency", "label": "Seizure Frequency", "type": "select", "options": ["None in past month", "1-2 per month", "Weekly", "Daily", "Multiple daily"]},
    {"key": "last_seizure_date", "label": "Last Seizure Date", "type": "date"},
    {"key": "seizure_duration", "label": "Typical Seizure Duration", "type": "select", "options": ["< 30 seconds", "30 sec - 2 min", "2-5 minutes", "> 5 minutes"]},
    {"key": "seizure_triggers", "label": "Known Triggers", "type": "checkbox_group", "options": ["Sleep deprivation", "Stress", "Missed medication", "Alcohol", "Flashing lights", "Illness/Fever", "Menstruation", "Unknown"]},
    {"key": "aura_symptoms", "label": "Aura Symptoms", "type": "checkbox_group", "options": ["Visual changes", "Deja vu", "Rising feeling", "Tingling", "Fear/anxiety", "None"]},
    {"key": "medication_compliance", "label": "Medication Compliance", "type": "select", "options": ["Fully compliant", "Mostly compliant", "Partially compliant", "Non-compliant"]}
  ]'::jsonb,
  false
),
(
  'Cardiology',
  'cardiology',
  '[
    {"key": "chest_pain", "label": "Chest Pain", "type": "select", "options": ["None", "At rest", "With exertion", "Both"]},
    {"key": "chest_pain_severity", "label": "Chest Pain Severity (0-10)", "type": "slider", "min": 0, "max": 10},
    {"key": "palpitations", "label": "Palpitations", "type": "select", "options": ["None", "Occasional", "Frequent", "Constant"]},
    {"key": "shortness_of_breath", "label": "Shortness of Breath", "type": "select", "options": ["None", "With exertion", "At rest", "When lying down"]},
    {"key": "exercise_tolerance", "label": "Exercise Tolerance", "type": "select", "options": ["Normal", "Mildly reduced", "Moderately reduced", "Severely limited"]},
    {"key": "edema", "label": "Swelling/Edema", "type": "checkbox_group", "options": ["Feet/ankles", "Legs", "Abdominal", "None"]},
    {"key": "medication_compliance", "label": "Medication Compliance", "type": "select", "options": ["Fully compliant", "Mostly compliant", "Partially compliant", "Non-compliant"]}
  ]'::jsonb,
  false
),
(
  'Pediatrics',
  'pediatrics',
  '[
    {"key": "chief_complaint_severity", "label": "Chief Complaint Severity", "type": "select", "options": ["Mild", "Moderate", "Severe", "Critical"]},
    {"key": "fever", "label": "Fever Present", "type": "select", "options": ["No", "Low grade (99-100.4°F)", "Moderate (100.4-102°F)", "High (>102°F)"]},
    {"key": "feeding_status", "label": "Feeding/Appetite", "type": "select", "options": ["Normal", "Slightly reduced", "Poor", "Refusing to eat/drink"]},
    {"key": "activity_level", "label": "Activity Level", "type": "select", "options": ["Normal/playful", "Slightly reduced", "Lethargic", "Unresponsive"]},
    {"key": "vaccination_status", "label": "Vaccination Status", "type": "select", "options": ["Up to date", "Behind schedule", "Unknown", "Unvaccinated"]},
    {"key": "developmental_concerns", "label": "Developmental Concerns", "type": "checkbox_group", "options": ["Speech delay", "Motor delay", "Social/behavioral", "Learning", "None"]}
  ]'::jsonb,
  false
);

-- Add trigger for updated_at
CREATE TRIGGER update_triage_templates_updated_at
  BEFORE UPDATE ON public.triage_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();