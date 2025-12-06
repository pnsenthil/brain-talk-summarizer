-- Update RLS policy to allow patients to view their own record
CREATE POLICY "Patients can view own record"
ON public.patients
FOR SELECT
USING (user_id = auth.uid());

-- Allow doctors/nurses to link patient user_id
CREATE POLICY "Staff can update patient user_id"
ON public.patients
FOR UPDATE
USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'nurse'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'nurse'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Drop old update policy if exists and recreate
DROP POLICY IF EXISTS "Doctors and nurses can update patients" ON public.patients;

-- Allow patients to view consultations they are part of
CREATE POLICY "Patients can view own consultations"
ON public.consultations
FOR SELECT
USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);