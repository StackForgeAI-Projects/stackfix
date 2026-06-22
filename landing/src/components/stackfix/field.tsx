export function Field({
  name,
  label,
  placeholder,
  type = "text",
  required,
  textarea,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  const cls =
    "mt-2 w-full rounded-xl bg-background/50 border border-border px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20 transition";
  return (
    <label className="block">
      <span className="text-muted-foreground text-xs tracking-wider uppercase">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          placeholder={placeholder}
          required={required}
          rows={4}
          className={cls}
        />
      ) : (
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          className={cls}
        />
      )}
    </label>
  );
}
