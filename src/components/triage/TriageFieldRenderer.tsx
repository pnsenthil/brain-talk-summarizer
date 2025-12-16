import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import type { TriageField } from "@/hooks/useTriageTemplate";

interface TriageFieldRendererProps {
  field: TriageField;
  value: any;
  onChange: (key: string, value: any) => void;
}

export const TriageFieldRenderer = ({ field, value, onChange }: TriageFieldRendererProps) => {
  switch (field.type) {
    case "select":
      return (
        <div className="space-y-2">
          <Label>{field.label}</Label>
          <Select value={value || ""} onValueChange={(v) => onChange(field.key, v)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "checkbox_group":
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          <Label>{field.label}</Label>
          <div className="grid grid-cols-2 gap-3">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.key}-${option}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange(field.key, [...selectedValues, option]);
                    } else {
                      onChange(field.key, selectedValues.filter((v: string) => v !== option));
                    }
                  }}
                />
                <label htmlFor={`${field.key}-${option}`} className="text-sm cursor-pointer">
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>
      );

    case "date":
      return (
        <div className="space-y-2">
          <Label>{field.label}</Label>
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </div>
      );

    case "slider":
      const sliderValue = typeof value === "number" ? value : field.min || 0;
      return (
        <div className="space-y-2">
          <Label>{field.label}: {sliderValue}</Label>
          <Slider
            value={[sliderValue]}
            min={field.min || 0}
            max={field.max || 10}
            step={1}
            onValueChange={([v]) => onChange(field.key, v)}
            className="py-2"
          />
        </div>
      );

    case "textarea":
      return (
        <div className="space-y-2">
          <Label>{field.label}</Label>
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={3}
          />
        </div>
      );

    case "text":
    default:
      return (
        <div className="space-y-2">
          <Label>{field.label}</Label>
          <Input
            value={value || ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        </div>
      );
  }
};
