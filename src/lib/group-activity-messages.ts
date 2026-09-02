import type { Note } from "@/lib/data";

function threadId(note: Note) {
  if (note.kind === "email") return note.emailThreadId;
  if (note.kind === "chat") return note.chatThreadId;
  return undefined;
}

export function groupAdjacentMessages(items: Note[]) {
  const grouped: Note[] = [];

  for (let index = 0; index < items.length; ) {
    const item = items[index];
    const itemThreadId = threadId(item);
    if (!itemThreadId) {
      grouped.push(item);
      index += 1;
      continue;
    }

    const run = [item];
    let nextIndex = index + 1;
    while (
      nextIndex < items.length &&
      items[nextIndex].kind === item.kind &&
      threadId(items[nextIndex]) === itemThreadId
    ) {
      run.push(items[nextIndex]);
      nextIndex += 1;
    }

    const messageCount = run.reduce((total, note) => {
      const storedCount = Number.parseInt(note.badge ?? "", 10);
      return total + (Number.isFinite(storedCount) ? storedCount : 1);
    }, 0);
    grouped.push({
      ...run[0],
      badge: messageCount > 1 ? String(messageCount) : undefined,
    });
    index = nextIndex;
  }

  return grouped;
}
