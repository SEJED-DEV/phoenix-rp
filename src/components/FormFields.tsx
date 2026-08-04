"use client";

import type { ApplicationField } from "@/lib/applications.data";

interface FormFieldsProps {
  fields: ApplicationField[];
  form: Record<string, string>;
  setField: (name: string, value: string) => void;
  textareaRows?: number;
}

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-text placeholder:text-text-dim/50 focus:outline-none focus:border-crimson/40 focus:bg-white/[0.06] transition-all text-sm";
const labelClass = "block text-sm font-medium text-text-muted mb-2";

export default function FormFields({ fields, form, setField, textareaRows = 3 }: FormFieldsProps) {
  return (
    <>
      {fields.map((field) => (
        <div key={field.name}>
          <label className={labelClass}>{field.label}</label>
          {field.type === "textarea" ? (
            <textarea
              required={field.required}
              rows={textareaRows}
              className={inputClass}
              placeholder={field.placeholder}
              value={form[field.name] || ""}
              onChange={(e) => setField(field.name, e.target.value)}
            />
          ) : field.type === "select" ? (
            <select
              required={field.required}
              className={inputClass}
              value={form[field.name] || ""}
              onChange={(e) => setField(field.name, e.target.value)}
            >
              <option value="">Select...</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              required={field.required}
              className={inputClass}
              placeholder={field.placeholder}
              value={form[field.name] || ""}
              onChange={(e) => setField(field.name, e.target.value)}
            />
          )}
        </div>
      ))}
    </>
  );
}
