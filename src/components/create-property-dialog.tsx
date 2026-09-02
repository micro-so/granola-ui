"use client";

import { CaretDown, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

const controlClass =
  "mt-2 w-full rounded-xl border border-border bg-hover px-4 py-3 text-[14px] text-foreground outline-none placeholder:text-placeholder focus:border-[#b6cf3a]";

export function CreatePropertyDialog({
  objectLabel,
  onClose,
}: {
  objectLabel: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [group, setGroup] = useState("general");
  const [description, setDescription] = useState("");
  const [required, setRequired] = useState("false");
  const [defaultValue, setDefaultValue] = useState("");

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 py-5 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-property-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onClose();
        }}
        className="flex max-h-[calc(100vh-2.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-foreground/10 bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-7 py-5">
          <div>
            <h2
              id="create-property-title"
              className="text-[20px] font-medium tracking-[-0.015em] text-foreground"
            >
              Create property
            </h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Add a custom property to {objectLabel.toLowerCase()} records.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close property creator"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6 scrollbar-thin">
          <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
            <PropertyField label="Name">
              <input
                autoFocus
                required
                value={name}
                placeholder="Property name"
                onChange={(event) => setName(event.target.value)}
                className={controlClass}
              />
            </PropertyField>
            <PropertyField label="Type">
              <PropertySelect value={type} onChange={setType}>
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="currency">Currency</option>
                <option value="date">Date</option>
                <option value="checkbox">Checkbox</option>
                <option value="select">Select</option>
                <option value="multiselect">Multi-select</option>
                <option value="person">Person</option>
                <option value="company">Company</option>
              </PropertySelect>
            </PropertyField>
            <PropertyField label="Group">
              <PropertySelect value={group} onChange={setGroup}>
                <option value="general">General</option>
                <option value="relationship">Relationship</option>
                <option value="work">Work</option>
                <option value="sales">Sales</option>
                <option value="custom">Custom</option>
              </PropertySelect>
            </PropertyField>
            <PropertyField label="Required">
              <PropertySelect value={required} onChange={setRequired}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </PropertySelect>
            </PropertyField>
            <PropertyField label="Description" wide>
              <textarea
                rows={3}
                value={description}
                placeholder="Explain what this property stores"
                onChange={(event) => setDescription(event.target.value)}
                className={`${controlClass} resize-y`}
              />
            </PropertyField>
            <PropertyField label="Default value" wide>
              <input
                value={defaultValue}
                placeholder="Optional"
                onChange={(event) => setDefaultValue(event.target.value)}
                className={controlClass}
              />
            </PropertyField>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-border bg-surface px-7 py-5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-border bg-hover px-4 text-[14px] text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="h-10 rounded-xl bg-[#b6cf3a] px-5 text-[14px] font-medium text-[#151515] hover:bg-[#c7df4a] disabled:opacity-50"
          >
            Create property
          </button>
        </div>
      </form>
    </div>
  );
}

function PropertyField({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`block min-w-0 text-[13px] text-muted-foreground ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      {label}
      {children}
    </label>
  );
}

function PropertySelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mt-2">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-xl border border-border bg-hover px-4 py-3 pr-11 text-[14px] text-foreground outline-none focus:border-[#b6cf3a]"
      >
        {children}
      </select>
      <CaretDown className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
