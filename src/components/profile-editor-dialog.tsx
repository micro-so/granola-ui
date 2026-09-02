"use client";

import { CaretDown, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import type { Company, Person } from "@/lib/data";
import type {
  EditableProperty,
  EditablePropertyOption,
} from "@/lib/micro-editable";

type ProfileType = "person" | "company";
type EditableProfile = Person | Company;

function listItems(value: string) {
  return [...new Set(value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean))];
}

function serializeValue(field: EditableProperty) {
  const value = field.value;
  if (value == null) return "";
  if (field.type === "date" && typeof value === "string") return value.slice(0, 16);
  if (field.type === "bool") return value ? "true" : "false";
  if (Array.isArray(value)) return value.map(String).join("\n");
  if (field.type === "jsonb" && typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function deserializeValue(field: EditableProperty, value: string): unknown {
  switch (field.type) {
    case "num":
      if (!value.trim()) return null;
      if (!Number.isFinite(Number(value))) throw new Error(`${field.name} must be a number.`);
      return Number(value);
    case "bool":
      return value ? value === "true" : null;
    case "multi_str":
    case "multiselect_str":
      return listItems(value);
    case "jsonb":
      if (!value.trim()) return null;
      try {
        return JSON.parse(value) as unknown;
      } catch {
        throw new Error(`${field.name} must contain valid JSON.`);
      }
    case "date":
      return value ? new Date(value).toISOString() : "";
    default:
      return value.trim();
  }
}

function fieldIsWide(field: EditableProperty) {
  return (
    field.type === "text" ||
    field.type === "jsonb" ||
    field.type === "multi_str" ||
    field.type === "multiselect_str" ||
    ["summary", "about", "tagline", "categories", "domains"].includes(field.slug)
  );
}

export function ProfileEditorDialog({
  profileType,
  profile,
  onClose,
}: {
  profileType: ProfileType;
  profile: EditableProfile;
  onClose: () => void;
}) {
  const endpoint = profileType === "person" ? "/api/people" : "/api/companies";
  const [fields, setFields] = useState<EditableProperty[] | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<Record<string, EditablePropertyOption[]>>({});
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${endpoint}?id=${encodeURIComponent(profile.id)}&editor=1`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as {
          fields?: EditableProperty[];
          message?: string;
        };
        if (!response.ok) throw new Error(data.message || "Could not load record properties.");
        if (controller.signal.aborted) return;
        const nextFields = data.fields ?? [];
        setFields(nextFields);
        setValues(
          Object.fromEntries(nextFields.map((field) => [field.slug, serializeValue(field)])),
        );
      })
      .catch((caught) => {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "Could not load record properties.");
        setFields([]);
      });
    return () => controller.abort();
  }, [endpoint, profile.id]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, saving]);

  const filteredFields = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return fields ?? [];
    return (fields ?? []).filter((field) =>
      `${field.name} ${field.slug}`.toLowerCase().includes(term),
    );
  }, [fields, search]);
  const groupedFields = useMemo(() => {
    const groups = new Map<string, EditableProperty[]>();
    for (const field of filteredFields) {
      const items = groups.get(field.group) ?? [];
      items.push(field);
      groups.set(field.group, items);
    }
    return [...groups.entries()];
  }, [filteredFields]);

  async function loadOptions(field: EditableProperty) {
    if (
      !["select_str", "multiselect_str"].includes(field.type) ||
      options[field.slug] ||
      loadingOptions[field.slug]
    ) {
      return;
    }
    setLoadingOptions((current) => ({ ...current, [field.slug]: true }));
    try {
      const response = await fetch(
        `${endpoint}?id=${encodeURIComponent(profile.id)}&editorOptions=${encodeURIComponent(field.slug)}`,
      );
      const data = (await response.json()) as {
        options?: EditablePropertyOption[];
        message?: string;
      };
      if (!response.ok) throw new Error(data.message || `Could not load ${field.name} choices.`);
      setOptions((current) => ({ ...current, [field.slug]: data.options ?? [] }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Could not load ${field.name} choices.`);
    } finally {
      setLoadingOptions((current) => ({ ...current, [field.slug]: false }));
    }
  }

  async function save() {
    if (!fields) return;
    const properties: Record<string, unknown> = {};
    try {
      for (const field of fields) {
        const value = values[field.slug] ?? "";
        if (value === serializeValue(field)) continue;
        properties[field.slug] = deserializeValue(field, value);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Check the changed values.");
      return;
    }
    if (Object.keys(properties).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: profile.id, properties }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Could not update profile.");
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update profile.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-5 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-editor-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="flex max-h-[calc(100vh-2.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-foreground/10 bg-surface shadow-2xl"
      >
        <div className="shrink-0 border-b border-border px-7 py-5">
          <div className="flex items-center justify-between">
            <h2 id="profile-editor-title" className="text-[24px] font-medium tracking-[-0.02em] text-foreground">
              Edit {profileType === "person" ? "person" : "company"}
            </h2>
            <button
              type="button"
              aria-label="Close editor"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-hover hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6 scrollbar-thin">
          <label className="mb-6 flex h-11 items-center gap-2.5 rounded-xl border border-border bg-hover px-3.5 focus-within:border-muted-foreground">
            <MagnifyingGlass className="h-4 w-4 shrink-0 text-placeholder" />
            <span className="sr-only">Search properties</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search properties"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-placeholder"
            />
          </label>
          {!fields ? (
            <div role="status" className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index}>
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton mt-2 h-11 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredFields.length > 0 ? (
            <div>
              {groupedFields.map(([group, groupFields], groupIndex) => (
                <section
                  key={group}
                  className={groupIndex === 0 ? "pb-6" : "border-t border-border py-6"}
                >
                  <h3 className="mb-4 text-[16px] font-medium text-foreground">{group}</h3>
                  <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                    {groupFields.map((field) => (
                      <DynamicEditorField
                        key={field.slug}
                        field={field}
                        value={values[field.slug] ?? ""}
                        choices={options[field.slug]}
                        loadingChoices={Boolean(loadingOptions[field.slug])}
                        onLoadChoices={() => void loadOptions(field)}
                        onChange={(value) =>
                          setValues((current) => ({ ...current, [field.slug]: value }))
                        }
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[13px] text-muted-foreground">
              No matching properties.
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-border bg-surface px-7 py-5">
          {error ? <p className="mr-auto max-w-[60%] text-[12px] text-[#ff9180]">{error}</p> : null}
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-border bg-hover px-4 text-[14px] text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !fields}
            onClick={() => void save()}
            className="h-10 rounded-xl bg-[#b6cf3a] px-5 text-[14px] font-medium text-[#151515] hover:bg-[#c7df4a] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DynamicEditorField({
  field,
  value,
  choices,
  loadingChoices,
  onLoadChoices,
  onChange,
}: {
  field: EditableProperty;
  value: string;
  choices?: EditablePropertyOption[];
  loadingChoices: boolean;
  onLoadChoices: () => void;
  onChange: (value: string) => void;
}) {
  const wide = fieldIsWide(field);
  const controlClass =
    "mt-2 w-full rounded-xl border border-border bg-hover px-4 py-3 text-[14px] text-foreground outline-none placeholder:text-placeholder focus:border-muted-foreground";
  const selected = listItems(value);
  const currentChoices = choices ?? selected.map((slug) => ({ slug, value: slug }));

  return (
    <label className={`block min-w-0 text-[13px] text-muted-foreground ${wide ? "sm:col-span-2" : ""}`}>
      <span className="flex items-center justify-between gap-2">
        <span className="truncate">
          {field.name}
          {field.required ? <span className="text-placeholder"> *</span> : null}
        </span>
      </span>

      {field.type === "bool" ? (
        <div className="relative">
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={`${controlClass} appearance-none pr-11`}
          >
            <option value="">Unset</option>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
          <CaretDown className="pointer-events-none absolute right-4 top-1/2 mt-1 h-3.5 w-3.5 text-muted-foreground" />
        </div>
      ) : field.type === "select_str" ? (
        <div className="relative">
          <select
            value={value}
            onFocus={onLoadChoices}
            onMouseDown={onLoadChoices}
            onChange={(event) => onChange(event.target.value)}
            className={`${controlClass} appearance-none pr-11`}
          >
            <option value="">{loadingChoices ? "Loading choices…" : "None"}</option>
            {currentChoices.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.value}
              </option>
            ))}
          </select>
          <CaretDown className="pointer-events-none absolute right-4 top-1/2 mt-1 h-3.5 w-3.5 text-muted-foreground" />
        </div>
      ) : field.slug === "skills_and_interests" ? (
        <textarea
          value={value}
          rows={3}
          placeholder="Type skills or interests, separated by commas"
          onChange={(event) => onChange(event.target.value)}
          className={`${controlClass} resize-y`}
        />
      ) : field.type === "multiselect_str" ? (
        <MultiSelectEditor
          id={`profile-options-${field.slug}`}
          selected={selected}
          choices={currentChoices}
          loading={loadingChoices}
          onLoadChoices={onLoadChoices}
          onChange={(items) => onChange(items.join("\n"))}
        />
      ) : field.type === "text" ||
        field.type === "jsonb" ||
        field.type === "multi_str" ||
        ["summary", "about", "tagline"].includes(field.slug) ? (
        <textarea
          value={value}
          rows={field.type === "text" || field.type === "jsonb" ? 4 : 2}
          placeholder={field.type === "multi_str" ? "One value per line" : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={`${controlClass} resize-y ${field.type === "jsonb" ? "font-mono" : ""}`}
        />
      ) : (
        <input
          type={field.type === "num" ? "number" : field.type === "date" ? "datetime-local" : "text"}
          step={field.type === "num" ? "any" : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={controlClass}
        />
      )}
    </label>
  );
}

function MultiSelectEditor({
  id,
  selected,
  choices,
  loading,
  onLoadChoices,
  onChange,
}: {
  id: string;
  selected: string[];
  choices: EditablePropertyOption[];
  loading: boolean;
  onLoadChoices: () => void;
  onChange: (items: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const labels = new Map(choices.map((option) => [option.slug, option.value]));
  const normalizedTerm = term.trim().toLowerCase();
  const available = choices
    .filter(
      (option) =>
        !selected.includes(option.slug) &&
        (!normalizedTerm ||
          `${option.value} ${option.slug}`.toLowerCase().includes(normalizedTerm)),
    )
    .slice(0, 50);

  return (
    <div className="relative mt-2">
      <div className="min-h-12 rounded-xl border border-border bg-hover p-3 focus-within:border-muted-foreground">
        {selected.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1">
            {selected.map((slug) => (
              <span
                key={slug}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] text-foreground"
              >
                <span className="truncate">{labels.get(slug) || slug}</span>
                <button
                  type="button"
                  aria-label={`Remove ${labels.get(slug) || slug}`}
                  onClick={() => onChange(selected.filter((item) => item !== slug))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <input
          value={term}
          role="combobox"
          aria-controls={id}
          aria-expanded={open}
          aria-autocomplete="list"
          placeholder={loading ? "Loading choices…" : "Search and add"}
          onFocus={() => {
            setOpen(true);
            onLoadChoices();
          }}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 100)}
          className="w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-placeholder"
        />
      </div>
      {open && !loading && choices.length > selected.length ? (
        <div
          id={id}
          role="listbox"
          className="relative z-20 mt-1.5 max-h-44 overflow-y-auto rounded-xl border border-border bg-sidebar p-1.5 shadow-xl scrollbar-thin"
        >
          {available.length > 0 ? (
            available.map((option) => (
              <button
                key={option.slug}
                type="button"
                role="option"
                aria-selected="false"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange([...selected, option.slug]);
                  setTerm("");
                }}
                className="block w-full rounded-md px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-hover"
              >
                {option.value}
              </button>
            ))
          ) : (
            <div className="px-2 py-2 text-[11px] text-placeholder">No matching choices.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
