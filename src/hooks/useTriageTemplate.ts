import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TriageField {
  key: string;
  label: string;
  type: "select" | "checkbox_group" | "date" | "slider" | "text" | "textarea";
  options?: string[];
  min?: number;
  max?: number;
}

export interface TriageTemplate {
  id: string;
  name: string;
  specialty: string;
  fields: TriageField[];
  is_default: boolean;
}

export const useTriageTemplates = () => {
  const [templates, setTemplates] = useState<TriageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from("triage_templates")
        .select("*")
        .order("is_default", { ascending: false });

      if (!error && data) {
        setTemplates(data.map(t => ({
          ...t,
          fields: t.fields as unknown as TriageField[]
        })));
      }
      setLoading(false);
    };

    fetchTemplates();
  }, []);

  return { templates, loading };
};

export const useTriageTemplate = (templateId?: string, specialty?: string) => {
  const [template, setTemplate] = useState<TriageTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      let query = supabase.from("triage_templates").select("*");

      if (templateId) {
        query = query.eq("id", templateId);
      } else if (specialty) {
        query = query.eq("specialty", specialty);
      } else {
        query = query.eq("is_default", true);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        setTemplate({
          ...data,
          fields: data.fields as unknown as TriageField[]
        });
      }
      setLoading(false);
    };

    fetchTemplate();
  }, [templateId, specialty]);

  return { template, loading };
};
