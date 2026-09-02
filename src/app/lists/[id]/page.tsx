import { MicroListPage } from "@/components/micro-list-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MicroListPage listId={id} />;
}
