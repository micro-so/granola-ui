import { CompanyPanel } from "@/components/company-panel";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CompanyPanel companyId={id} />;
}
