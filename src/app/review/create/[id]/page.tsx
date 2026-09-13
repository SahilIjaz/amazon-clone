import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { product } from "@/lib/products";
import ReviewForm from "@/components/ReviewForm";

export const metadata: Metadata = { title: "Create Review" };
export const dynamic = "force-dynamic";

export default async function CreateReview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = product(id); if (!p) notFound();
  const user = await currentUser(); if (!user) redirect(`/ap/signin?returnTo=/review/create/${id}`);
  return (
    <div className="mx-auto max-w-[700px] px-5 py-6 text-[14px]">
      <h1 className="text-[28px] font-normal">Create Review</h1>
      <div className="mt-3 flex items-center gap-3"><div className="relative h-[60px] w-[60px]"><Image src={p.thumb} alt="" fill sizes="60px" className="object-contain" /></div><p className="font-bold truncate-2">{p.title}</p></div>
      <ReviewForm productId={p.id} />
    </div>
  );
}
