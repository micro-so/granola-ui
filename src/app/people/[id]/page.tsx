import { notFound } from "next/navigation";
import { PersonPanel } from "@/components/person-panel";
import { personById } from "@/lib/data";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = personById(id);
  if (!person) notFound();
  return <PersonPanel person={person} />;
}
