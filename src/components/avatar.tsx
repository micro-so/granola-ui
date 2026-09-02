"use client";

import { useState } from "react";
import { usablePhotoUrl } from "@/lib/photo-url";

type Props = {
  name: string;
  color?: string;
  photoUrl?: string;
  size?: number;
  rounded?: "full" | "md";
};

function initialFrom(name: string) {
  const letter = name.replace(/\(me\)/i, "").trim()[0];
  return letter ? letter.toUpperCase() : "?";
}

function Initials({
  name,
  color,
  size,
  className,
}: {
  name: string;
  color: string;
  size: number;
  className: string;
}) {
  return (
    <span
      className={`flex items-center justify-center font-serif font-normal text-heading ${className}`}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: Math.round(size * 0.58),
      }}
    >
      {initialFrom(name)}
    </span>
  );
}

export function Avatar({ name, color = "#3f3f46", photoUrl, size = 36, rounded = "full" }: Props) {
  const safeUrl = usablePhotoUrl(photoUrl);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const radius = rounded === "full" ? "rounded-full" : "rounded-[5px]";
  const outline = `${radius} shrink-0 ring-1 ring-inset ring-foreground/[0.08]`;
  const showImage = Boolean(safeUrl) && failedUrl !== safeUrl;

  if (showImage && safeUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={safeUrl}
        alt=""
        className={`${outline} object-cover`}
        style={{ width: size, height: size }}
        onError={() => setFailedUrl(safeUrl)}
      />
    );
  }

  return <Initials name={name} color={color} size={size} className={outline} />;
}
