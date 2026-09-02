import { PersonPanel } from "@/components/person-panel";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PersonPanel personId={id} />;
}
