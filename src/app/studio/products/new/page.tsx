import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-[140px]">
      <h1 className="h-section">New Product</h1>
      <ProductForm />
    </div>
  );
}
