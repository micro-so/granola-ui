import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Person } from "@/lib/data";

type LocalIMessageFixture = {
  conversations?: Array<{
    personIds?: string[];
    participantPhone?: string;
  }>;
};

export async function getLocalPersonOverride(
  personId: string,
): Promise<Partial<Person>> {
  const fixturePath = path.join(
    process.cwd(),
    ".local",
    "imessage-activity.json",
  );

  try {
    const fixture = JSON.parse(
      await readFile(/* turbopackIgnore: true */ fixturePath, "utf8"),
    ) as LocalIMessageFixture;
    const conversation = fixture.conversations?.find(
      (item) =>
        item.personIds?.includes(personId) && item.participantPhone,
    );
    return conversation?.participantPhone
      ? { phone: conversation.participantPhone }
      : {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}
