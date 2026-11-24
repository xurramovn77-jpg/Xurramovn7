import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface FloatingLabelInputProps {
  id: string;
  label: string;
  hint?: string;
  type?: 'text' | 'password';
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  enablePasswordToggle?: boolean;
  onBlur?: () => void;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  id,
  label,
  hint,
  type = 'text',
  value,
  onChange,
  autoComplete,
  required = false,
  invalid = false,
  describedBy,
  inputRef,
  enablePasswordToggle = false,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const effectiveType = type === 'password' && showPassword ? 'text' : type;
  const isEmpty = value.length === 0;

  return (
    <div
      className={`nx-float-field ${isFocused ? 'is-focused' : ''} ${
        isEmpty ? 'is-empty' : ''
      } ${invalid ? 'is-invalid' : ''} ${enablePasswordToggle ? 'has-toggle' : ''}`}
    >
      <div className="nx-float-glow" aria-hidden="true" />
      <input
        ref={inputRef}
        id={id}
        type={effectiveType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        required={required}
        autoComplete={autoComplete}
        placeholder=" "
        aria-invalid={invalid ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`nx-float-input ${enablePasswordToggle ? 'has-toggle' : ''}`}
      />
      <label htmlFor={id} className="nx-float-label">
        {label}
      </label>
      {hint && (
        <span className="nx-float-hint" aria-hidden="true">
          {hint}
        </span>
      )}
      {enablePasswordToggle && type === 'password' && (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] hover:border-white/[0.14] px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer"
        >
          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showPassword ? 'Yashirish' : "Ko'rish"}</span>
        </button>
      )}
    </div>
  );
};
