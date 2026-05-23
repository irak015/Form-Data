import React from "react";
import { LucideIcon } from "lucide-react";

interface GlassInputProps {
  id: string;
  label: string;
  icon: LucideIcon;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  isTextArea?: boolean;
  hint?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  id,
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  maxLength,
  isTextArea = false,
  hint,
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <div className="flex flex-col gap-1.5 w-full group">
      <label
        htmlFor={id}
        className="text-xs font-bold text-white uppercase tracking-widest ml-1 flex items-center gap-2 transition-all duration-300 group-focus-within:translate-x-0.5"
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
        {required && <span className="text-pink-300 font-bold">*</span>}
      </label>

      <div className="relative w-full transition-all duration-300">
        {/* Input box */}
        {isTextArea ? (
          <textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={2}
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/40 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-white/50 transition-all font-medium outline-none backdrop-blur-md"
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/40 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-white/50 transition-all font-medium outline-none backdrop-blur-md"
          />
        )}

        {/* Action badge tags like text-length etc */}
        {maxLength && value && (
          <span className="absolute right-4 bottom-3 text-[10px] font-mono text-white/40 group-focus-within:text-cyan-300/60">
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      {hint && (
        <span className="text-[11px] text-white/50 font-medium pl-1 italic">
          {hint}
        </span>
      )}
    </div>
  );
};
