"use client";

import { CaretDown, MagnifyingGlass, Plus, Trash, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { CreatePropertyDialog } from "@/components/create-property-dialog";
import type { FolderProperties } from "@/lib/use-folder-properties";

const controlClass =
  "mt-2 w-full rounded-xl border border-border bg-hover px-4 py-3 text-[14px] text-foreground outline-none placeholder:text-placeholder focus:border-[#b6cf3a]";

export function FolderEditorDialog({
  properties,
  parentOptions,
  teamScoped,
  onSave,
  onClose,
}: {
  properties: FolderProperties;
  parentOptions: string[];
  teamScoped: boolean;
  onSave: (properties: FolderProperties) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState(properties);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const term = search.trim().toLowerCase();
  const show = (...labels: string[]) =>
    !term || labels.some((label) => label.toLowerCase().includes(term));

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !createOpen) onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [createOpen, onClose]);

  function update<K extends keyof FolderProperties>(
    key: K,
    value: FolderProperties[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-5 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="folder-editor-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            ...values,
            name: values.name.trim() || properties.name,
            description: values.description.trim(),
            subfolders: [...new Set(values.subfolders.map((item) => item.trim()).filter(Boolean))],
          });
          onClose();
        }}
        className="flex max-h-[calc(100vh-2.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-foreground/10 bg-surface shadow-2xl"
      >
        <div className="shrink-0 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h2
              id="folder-editor-title"
              className="text-[20px] font-medium tracking-[-0.015em] text-foreground"
            >
              Edit folder
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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
          <div className="mb-5 flex items-center gap-3">
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-border bg-hover px-3.5 focus-within:border-[#b6cf3a]">
              <MagnifyingGlass className="h-4 w-4 shrink-0 text-placeholder" />
              <span className="sr-only">Search properties</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search properties"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-placeholder"
              />
            </label>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-hover px-4 text-[14px] font-medium text-foreground hover:bg-muted"
            >
              <Plus className="h-4 w-4" weight="bold" />
              Create
            </button>
          </div>

          {show("Name", "Description") ? (
            <EditorSection title="General">
              {show("Name") ? (
                <EditorField label="Name">
                  <input
                    value={values.name}
                    onChange={(event) => update("name", event.target.value)}
                    className={controlClass}
                  />
                </EditorField>
              ) : null}
              {show("Description") ? (
                <EditorField label="Description" wide>
                  <textarea
                    rows={5}
                    value={values.description}
                    onChange={(event) => update("description", event.target.value)}
                    className={`${controlClass} resize-y`}
                  />
                </EditorField>
              ) : null}
            </EditorSection>
          ) : null}

          {show("Parent folder", "Subfolders") ? (
            <EditorSection title="Organization" divided>
              {show("Parent folder") ? (
                <EditorField label="Parent folder">
                  <SelectField
                    value={values.parentFolder}
                    onChange={(value) => update("parentFolder", value)}
                  >
                    <option value="">No parent folder</option>
                    {parentOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </SelectField>
                </EditorField>
              ) : null}
              {show("Subfolders") ? (
                <EditorField label="Subfolders" wide>
                  <SelectField
                    value={values.subfolders[0] || ""}
                    onChange={(value) => update("subfolders", value ? [value] : [])}
                  >
                    <option value="">No subfolder</option>
                    {parentOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </SelectField>
                </EditorField>
              ) : null}
            </EditorSection>
          ) : null}

          {show("Sharing", "Folder type", "Connected objects") ? (
            <EditorSection title="Behavior" divided>
              {show("Sharing") ? (
                <EditorField label="Sharing">
                  <SelectField
                    value={values.sharing}
                    onChange={(value) =>
                      update("sharing", value as FolderProperties["sharing"])
                    }
                  >
                    {!teamScoped ? <option value="private">Only me</option> : null}
                    <option value="selected">Selected team members</option>
                    <option value="team">Everyone at Micro team</option>
                  </SelectField>
                </EditorField>
              ) : null}
              {show("Folder type") ? (
                <EditorField label="Folder type">
                  <SelectField
                    value={values.folderType}
                    onChange={(value) =>
                      update("folderType", value as FolderProperties["folderType"])
                    }
                  >
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                  </SelectField>
                </EditorField>
              ) : null}
              {show("Connected objects") ? (
                <EditorField label="Add connected objects">
                  <SelectField
                    value={values.includeConnectedObjects ? "true" : "false"}
                    onChange={(value) =>
                      update("includeConnectedObjects", value === "true")
                    }
                  >
                    <option value="true">Automatically</option>
                    <option value="false">Ask every time</option>
                  </SelectField>
                </EditorField>
              ) : null}
            </EditorSection>
          ) : null}

          {!term ? (
            <section className="border-t border-border pt-4">
              <h3 className="text-[14px] font-medium text-foreground">Delete folder</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                This folder will be permanently deleted. Its records will not be affected.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirmingDelete) {
                    onClose();
                    return;
                  }
                  setConfirmingDelete(true);
                }}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-[14px] text-[#e86c5b] hover:border-[#e86c5b]/50 hover:bg-[#e86c5b]/5"
              >
                <Trash className="h-4.5 w-4.5" />
                {confirmingDelete ? "Confirm delete folder" : "Delete folder"}
              </button>
            </section>
          ) : null}

          {!show(
            "Name",
            "Description",
            "Parent folder",
            "Subfolders",
            "Sharing",
            "Folder type",
            "Connected objects",
          ) ? (
            <div className="py-8 text-center text-[13px] text-muted-foreground">
              No matching properties.
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-border bg-surface px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-border bg-hover px-4 text-[14px] text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-10 rounded-xl bg-[#b6cf3a] px-5 text-[14px] font-medium text-[#151515] hover:bg-[#c7df4a]"
          >
            Save
          </button>
        </div>
      </form>
      {createOpen ? (
        <CreatePropertyDialog
          objectLabel="Folder"
          onClose={() => setCreateOpen(false)}
        />
      ) : null}
    </div>
  );
}

function EditorSection({
  title,
  divided = false,
  children,
}: {
  title: string;
  divided?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={divided ? "border-t border-border py-4" : "pb-4"}>
      <h3 className="mb-3 text-[15px] font-medium text-foreground">{title}</h3>
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function EditorField({
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

function SelectField({
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
