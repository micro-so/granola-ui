import type { SocialHandles, SocialKind, SocialLink } from "@/lib/data";

const SOCIAL_META: Record<SocialKind, { label: string; href: (value: string) => string }> = {
  linkedin: {
    label: "LinkedIn",
    href: (value) => {
      if (value.startsWith("in/") || value.startsWith("company/") || value.startsWith("school/")) {
        return `https://www.linkedin.com/${value}`;
      }
      return `https://www.linkedin.com/in/${value}`;
    },
  },
  github: {
    label: "GitHub",
    href: (value) => `https://github.com/${value.replace(/^@/, "")}`,
  },
  twitter: {
    label: "X",
    href: (value) => `https://x.com/${value.replace(/^@/, "")}`,
  },
  crunchbase: {
    label: "Crunchbase",
    href: (value) => (value.includes("/") ? `https://www.crunchbase.com/${value}` : `https://www.crunchbase.com/person/${value}`),
  },
  facebook: {
    label: "Facebook",
    href: (value) => `https://www.facebook.com/${value.replace(/^@/, "")}`,
  },
};

export function socialHandle(value: unknown, depth = 0): string {
  if (depth > 4 || value == null) return "";
  if (typeof value === "string") return value.trim().replace(/\/+$/, "");
  if (typeof value === "object" && "value" in value) {
    return socialHandle((value as { value?: unknown }).value, depth + 1);
  }
  return "";
}

export function socialHandlesFrom(properties: Record<string, unknown>): SocialHandles {
  const handles: SocialHandles = {};
  for (const kind of Object.keys(SOCIAL_META) as SocialKind[]) {
    const value = socialHandle(properties[kind]);
    if (value) handles[kind] = value;
  }
  return handles;
}

export function socialLinks(handles: SocialHandles): SocialLink[] {
  const links: SocialLink[] = [];
  for (const kind of Object.keys(SOCIAL_META) as SocialKind[]) {
    const value = handles[kind]?.trim() ?? "";
    if (!value) continue;
    const meta = SOCIAL_META[kind];
    links.push({
      kind,
      label: meta.label,
      href: /^https?:\/\//i.test(value) ? value : meta.href(value),
    });
  }
  return links;
}

export type { SocialLink } from "@/lib/data";
