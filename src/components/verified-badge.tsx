import { SealCheck } from "@phosphor-icons/react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function placeholderMemberSince(id: string) {
  const score = [...id].reduce((total, character) => total + character.charCodeAt(0), 0);
  const month = MONTHS[score % MONTHS.length];
  const year = 2021 + (score % 5);
  return `${month} ${year}`;
}

export function isVerifiedEntity(entityId: string, name: string) {
  const normalizedName = name.trim().toLowerCase();
  if (normalizedName === "granola" || normalizedName.includes("nikola")) return true;

  const seed = `${entityId}:${normalizedName}`;
  const score = [...seed].reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) % 1009,
    7,
  );
  return score % 3 === 0;
}

export function VerifiedBadge({ entityId }: { entityId: string }) {
  const memberSince = placeholderMemberSince(entityId);

  return (
    <span
      tabIndex={0}
      aria-label={`Verified. Member since ${memberSince}`}
      className="group/verified relative inline-flex shrink-0 items-center outline-none"
    >
      <SealCheck className="h-4 w-4 text-[#b6cf3a]" weight="fill" />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 text-[12px] font-medium text-foreground opacity-0 shadow-lg transition-opacity group-hover/verified:opacity-100 group-focus-visible/verified:opacity-100"
      >
        Member since {memberSince}
      </span>
    </span>
  );
}
