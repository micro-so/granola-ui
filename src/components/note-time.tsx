function splitMeridiem(value: string) {
  const match = value.match(/^(.+?)\s+(AM|PM)$/i);
  if (!match) return null;
  return { clock: match[1], meridiem: match[2] };
}

export function NoteTime({ time }: { time: string }) {
  const parts = splitMeridiem(time);
  if (!parts) return <span>{time}</span>;

  return (
    <span className="inline-flex items-baseline justify-end gap-px">
      <span>{parts.clock}</span>
      <span className="text-[10px] leading-none">{parts.meridiem}</span>
    </span>
  );
}

export function EventRange({ start, end }: { start: string; end: string }) {
  const parts = splitMeridiem(end);
  if (!parts) {
    return (
      <span>
        {start} – {end}
      </span>
    );
  }

  return (
    <span className="inline-flex items-baseline gap-px">
      <span>
        {start} – {parts.clock}
      </span>
      <span className="text-[10px] leading-none">{parts.meridiem}</span>
    </span>
  );
}
