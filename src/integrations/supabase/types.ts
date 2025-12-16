export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clinical_notes: {
        Row: {
          assessment: string | null
          consultation_id: string
          created_at: string | null
          doctor_id: string
          follow_up: string | null
          id: string
          lab_orders: Json | null
          objective: string | null
          plan: string | null
          prescriptions: Json | null
          subjective: string | null
          updated_at: string | null
        }
        Insert: {
          assessment?: string | null
          consultation_id: string
          created_at?: string | null
          doctor_id: string
          follow_up?: string | null
          id?: string
          lab_orders?: Json | null
          objective?: string | null
          plan?: string | null
          prescriptions?: Json | null
          subjective?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment?: string | null
          consultation_id?: string
          created_at?: string | null
          doctor_id?: string
          follow_up?: string | null
          id?: string
          lab_orders?: Json | null
          objective?: string | null
          plan?: string | null
          prescriptions?: Json | null
          subjective?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          chief_complaint: string | null
          created_at: string | null
          doctor_id: string | null
          end_time: string | null
          id: string
          nurse_id: string | null
          patient_id: string
          priority: Database["public"]["Enums"]["priority_level"] | null
          scheduled_time: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["consultation_status"] | null
          transcription: string | null
          updated_at: string | null
          visit_type: string | null
        }
        Insert: {
          chief_complaint?: string | null
          created_at?: string | null
          doctor_id?: string | null
          end_time?: string | null
          id?: string
          nurse_id?: string | null
          patient_id: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          scheduled_time?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["consultation_status"] | null
          transcription?: string | null
          updated_at?: string | null
          visit_type?: string | null
        }
        Update: {
          chief_complaint?: string | null
          created_at?: string | null
          doctor_id?: string | null
          end_time?: string | null
          id?: string
          nurse_id?: string | null
          patient_id?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          scheduled_time?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["consultation_status"] | null
          transcription?: string | null
          updated_at?: string | null
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_uploads: {
        Row: {
          consultation_id: string | null
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          patient_id: string
          summary: string | null
          transcription: string | null
          updated_at: string
          upload_type: string
          uploaded_by: string | null
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          patient_id: string
          summary?: string | null
          transcription?: string | null
          updated_at?: string
          upload_type: string
          uploaded_by?: string | null
        }
        Update: {
          consultation_id?: string | null
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          patient_id?: string
          summary?: string | null
          transcription?: string | null
          updated_at?: string
          upload_type?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_uploads_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_uploads_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string[] | null
          created_at: string | null
          current_medications: Json | null
          date_of_birth: string
          diagnosis: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gender: string | null
          id: string
          mrn: string
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          created_at?: string | null
          current_medications?: Json | null
          date_of_birth: string
          diagnosis?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          gender?: string | null
          id?: string
          mrn: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          created_at?: string | null
          current_medications?: Json | null
          date_of_birth?: string
          diagnosis?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          mrn?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          license_number: string | null
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          license_number?: string | null
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          license_number?: string | null
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      triage_forms: {
        Row: {
          additional_notes: string | null
          completed: boolean | null
          consultation_id: string | null
          created_at: string | null
          form_data: Json | null
          id: string
          last_seizure_date: string | null
          medication_compliance: string | null
          nurse_id: string | null
          patient_id: string
          seizure_duration: string | null
          seizure_frequency: string | null
          side_effects: string | null
          sleep_quality: string | null
          stress_level: string | null
          template_id: string | null
          triggers: string[] | null
          updated_at: string | null
        }
        Insert: {
          additional_notes?: string | null
          completed?: boolean | null
          consultation_id?: string | null
          created_at?: string | null
          form_data?: Json | null
          id?: string
          last_seizure_date?: string | null
          medication_compliance?: string | null
          nurse_id?: string | null
          patient_id: string
          seizure_duration?: string | null
          seizure_frequency?: string | null
          side_effects?: string | null
          sleep_quality?: string | null
          stress_level?: string | null
          template_id?: string | null
          triggers?: string[] | null
          updated_at?: string | null
        }
        Update: {
          additional_notes?: string | null
          completed?: boolean | null
          consultation_id?: string | null
          created_at?: string | null
          form_data?: Json | null
          id?: string
          last_seizure_date?: string | null
          medication_compliance?: string | null
          nurse_id?: string | null
          patient_id?: string
          seizure_duration?: string | null
          seizure_frequency?: string | null
          side_effects?: string | null
          sleep_quality?: string | null
          stress_level?: string | null
          template_id?: string | null
          triggers?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "triage_forms_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triage_forms_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triage_forms_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triage_forms_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "triage_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      triage_templates: {
        Row: {
          created_at: string | null
          fields: Json
          id: string
          is_default: boolean | null
          name: string
          specialty: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fields: Json
          id?: string
          is_default?: boolean | null
          name: string
          specialty: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fields?: Json
          id?: string
          is_default?: boolean | null
          name?: string
          specialty?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "doctor" | "nurse" | "admin" | "patient"
      consultation_status: "waiting" | "in_progress" | "completed" | "cancelled"
      priority_level: "routine" | "urgent" | "emergency"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["doctor", "nurse", "admin", "patient"],
      consultation_status: ["waiting", "in_progress", "completed", "cancelled"],
      priority_level: ["routine", "urgent", "emergency"],
    },
  },
} as const
