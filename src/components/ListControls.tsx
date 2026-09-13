"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const post = async (body: Record<string, unknown>) => (await fetch("/api/lists", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json() as Promise<{ ok: boolean; id?: string }>;

export default function ListControls({ mode, listId, productId, open = false }: { mode: "create" | "delete" | "remove"; listId?: string; productId?: number; open?: boolean }) {
  const router = useRouter();
  const [show, setShow] = useState(open);
  const [name, setName] = useState("");
  if (mode === "remove") return <button type="button" onClick={async () => { await post({ action: "remove", listId, productId }); router.refresh(); }} className="a-button a-button-base a-button-pill a-button-block">Delete</button>;
  if (mode === "delete") return <button type="button" onClick={async () => { await post({ action: "delete-list", listId }); router.push("/hz/wishlist/ls"); router.refresh(); }} className="a-link text-[13px]">Delete list</button>;
  return (
    <>
      <button type="button" onClick={() => setShow(true)} className="a-link text-[13px]">Create a List</button>
      {show && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50" onClick={() => setShow(false)}>
          <div className="w-[420px] rounded-lg bg-white p-5 text-[14px]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[18px] font-bold">Create a new list</h2>
            <label className="mt-3 block text-[12px] font-bold">List name</label>
            <input className="a-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shopping List" autoFocus />
            <p className="mt-1 text-[12px] text-muted">Lists are private unless you share them.</p>
            <div className="mt-4 flex justify-end gap-2"><button type="button" className="a-button a-button-base a-button-pill" onClick={() => setShow(false)}>Cancel</button><button type="button" className="a-button a-button-primary a-button-pill" onClick={async () => { const r = await post({ action: "create", name }); setShow(false); if (r.ok) router.push(`/hz/wishlist/ls?list=${r.id}`); router.refresh(); }}>Create List</button></div>
          </div>
        </div>
      )}
    </>
  );
}
