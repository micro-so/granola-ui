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

export function Avatar({ name, color = "#3f3f46", photoUrl, size = 36, rounded = "full" }: Props) {
  const radius = rounded === "full" ? "rounded-full" : "rounded-[5px]";
  const outline = `${radius} shrink-0 ring-1 ring-inset ring-white/[0.08]`;

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        className={`${outline} object-cover`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={`flex items-center justify-center font-serif font-normal text-heading ${outline}`}
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
