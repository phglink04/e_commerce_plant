type FormInputProps = {
  id: string;
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "email" | "number" | "password";
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
};

export default function FormInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  min,
  max,
}: FormInputProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        min={min}
        max={max}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}
