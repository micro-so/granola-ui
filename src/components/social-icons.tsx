import { FacebookLogo, GithubLogo, GlobeSimple, LinkedinLogo, XLogo } from "@phosphor-icons/react";
import type { SocialKind, SocialLink } from "@/lib/data";

const ICONS: Record<SocialKind, typeof GithubLogo> = {
  linkedin: LinkedinLogo,
  github: GithubLogo,
  twitter: XLogo,
  crunchbase: GlobeSimple,
  facebook: FacebookLogo,
};

export function SocialIcons({ links }: { links: SocialLink[] }) {
  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {links.map((link) => {
        const Icon = ICONS[link.kind];
        return (
          <a
            key={link.kind}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={link.label}
            className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <Icon className="h-3.5 w-3.5" />
          </a>
        );
      })}
    </div>
  );
}
