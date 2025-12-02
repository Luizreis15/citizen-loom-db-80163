import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Upload, X } from "lucide-react";

interface OnboardingFormFieldProps {
  field: {
    key: string;
    label: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    sensitive?: boolean;
  };
  value: string;
  onChange: (key: string, value: string) => void;
  onFileUpload?: (key: string, file: File) => void;
  fileInfo?: { name: string; url: string } | null;
  disabled?: boolean;
}

export function OnboardingFormField({
  field,
  value,
  onChange,
  onFileUpload,
  fileInfo,
  disabled = false,
}: OnboardingFormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const renderField = () => {
    switch (field.type) {
      case "password":
        return (
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder || "••••••••"}
              disabled={disabled}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        );

      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={4}
          />
        );

      case "file":
        return (
          <div className="space-y-2">
            {fileInfo ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <span className="text-sm truncate flex-1">{fileInfo.name}</span>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileUpload?.(field.key, null as any)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Clique para enviar</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFileUpload?.(field.key, file);
                  }}
                  disabled={disabled}
                />
              </label>
            )}
          </div>
        );

      case "url":
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || "https://"}
            disabled={disabled}
          />
        );

      case "email":
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
          />
        );

      case "phone":
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || "(00) 00000-0000"}
            disabled={disabled}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
        {field.sensitive && (
          <span className="text-xs text-muted-foreground ml-2">(criptografado)</span>
        )}
      </Label>
      {renderField()}
    </div>
  );
}
