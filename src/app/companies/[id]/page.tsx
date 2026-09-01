import { notFound } from "next/navigation";
import { CompanyPanel } from "@/components/company-panel";
import { companyById } from "@/lib/data";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = companyById(id);
  if (!company) notFound();
  return <CompanyPanel company={company} />;
}
