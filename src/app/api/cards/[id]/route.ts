import { NextRequest, NextResponse } from "next/server";
import { deleteCard } from "@/lib/db/tracking-queries";
import { audit } from "@/lib/audit";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const card = await deleteCard(id);
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit("DELETE", "card", card.id, {
    last4: card.last4,
    cardholderName: card.cardholderName,
  });
  return NextResponse.json(card);
}
