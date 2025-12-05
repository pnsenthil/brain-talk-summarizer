-- Add patient role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'patient';

-- Create patient_uploads table for voice notes and documents
CREATE TABLE public.patient_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('voice_note', 'medical_report', 'prescription')),
  file_url TEXT,
  file_name TEXT,
  transcription TEXT,
  summary TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_uploads ENABLE ROW LEVEL SECURITY;

-- Patients can view and create their own uploads
CREATE POLICY "Patients can view own uploads"
ON public.patient_uploads
FOR SELECT
USING (
  uploaded_by = auth.uid() OR
  has_role(auth.uid(), 'doctor'::app_role) OR
  has_role(auth.uid(), 'nurse'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Patients can create own uploads"
ON public.patient_uploads
FOR INSERT
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Doctors can update uploads"
ON public.patient_uploads
FOR UPDATE
USING (
  has_role(auth.uid(), 'doctor'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add trigger for updated_at
CREATE TRIGGER update_patient_uploads_updated_at
BEFORE UPDATE ON public.patient_uploads
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for patient uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-uploads', 'patient-uploads', false);

-- Storage policies
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'patient-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'patient-uploads' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('doctor', 'nurse', 'admin'))
  )
);

-- Link patients table to auth users (add user_id column)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);