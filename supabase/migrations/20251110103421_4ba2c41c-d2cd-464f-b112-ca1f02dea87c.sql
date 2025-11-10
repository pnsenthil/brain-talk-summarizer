-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('doctor', 'nurse', 'admin');

-- Create enum for patient priority
CREATE TYPE public.priority_level AS ENUM ('routine', 'urgent', 'emergency');

-- Create enum for consultation status
CREATE TYPE public.consultation_status AS ENUM ('waiting', 'in_progress', 'completed', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  specialty TEXT,
  license_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mrn TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  diagnosis TEXT,
  current_medications JSONB DEFAULT '[]'::jsonb,
  allergies TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create consultations table
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nurse_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status consultation_status DEFAULT 'waiting',
  priority priority_level DEFAULT 'routine',
  chief_complaint TEXT,
  visit_type TEXT,
  scheduled_time TIMESTAMPTZ,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  transcription TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create clinical_notes table
CREATE TABLE public.clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  prescriptions JSONB DEFAULT '[]'::jsonb,
  lab_orders JSONB DEFAULT '[]'::jsonb,
  follow_up TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create triage_forms table
CREATE TABLE public.triage_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  nurse_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  seizure_frequency TEXT,
  seizure_duration TEXT,
  last_seizure_date DATE,
  triggers TEXT[],
  medication_compliance TEXT,
  side_effects TEXT,
  sleep_quality TEXT,
  stress_level TEXT,
  additional_notes TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for patients
CREATE POLICY "Doctors and nurses can view patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Doctors and nurses can create patients"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Doctors and nurses can update patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for consultations
CREATE POLICY "Doctors and nurses can view consultations"
  ON public.consultations FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Doctors and nurses can create consultations"
  ON public.consultations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Doctors can update consultations"
  ON public.consultations FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for clinical_notes
CREATE POLICY "Doctors can view clinical notes"
  ON public.clinical_notes FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Doctors can create clinical notes"
  ON public.clinical_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'doctor') AND
    doctor_id = auth.uid()
  );

CREATE POLICY "Doctors can update own clinical notes"
  ON public.clinical_notes FOR UPDATE
  TO authenticated
  USING (
    doctor_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for triage_forms
CREATE POLICY "Nurses and doctors can view triage forms"
  ON public.triage_forms FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Nurses can create triage forms"
  ON public.triage_forms FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'nurse') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Nurses can update triage forms"
  ON public.triage_forms FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'nurse') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER clinical_notes_updated_at
  BEFORE UPDATE ON public.clinical_notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER triage_forms_updated_at
  BEFORE UPDATE ON public.triage_forms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();