"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

type SearchableSelectProps = {
  label: string;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
  options: readonly string[];
  value: string;
  otherValue: string;
  onChange: (value: string, otherValue: string) => void;
  hint?: string;
};

export function SearchableSelect({
  label,
  required,
  optional,
  placeholder = "Search or select…",
  options,
  value,
  otherValue,
  onChange,
  hint,
}: SearchableSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isOther = value === "Other";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...options];
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const displayValue = isOther ? (otherValue || "Other") : value;

  return (
    <div ref={rootRef}>
      <label className="text-sm font-semibold mb-1.5 block" htmlFor={listId}>
        {label}
        {required && <span className="text-brand ml-0.5">*</span>}
        {optional && <span className="text-muted-foreground font-normal ml-1">(optional)</span>}
      </label>

      <div className="relative">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
        <input
          id={listId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          value={open ? query : displayValue}
          placeholder={placeholder}
          required={required && !isOther ? !!value && value !== "Other" : required && isOther ? !!otherValue.trim() : false}
          onFocus={() => {
            setOpen(true);
            setQuery(isOther ? otherValue : value);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="stackfix-form-input pl-9 pr-10"
        />
        <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>

      {open && (
        <ul
          className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-white shadow-lg z-20 relative"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No matches</li>
          ) : (
            filtered.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors ${
                    value === option ? "bg-brand/10 text-foreground font-semibold" : ""
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(option, option === "Other" ? otherValue : "");
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  {option}
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {isOther && (
        <input
          type="text"
          value={otherValue}
          onChange={(e) => onChange("Other", e.target.value)}
          placeholder={`Enter custom ${label.toLowerCase()}`}
          required={required}
          className="stackfix-form-input mt-2"
        />
      )}

      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}

export function resolveCatalogValue(value: string, otherValue: string): string {
  if (value === "Other") return otherValue.trim();
  return value.trim();
}
