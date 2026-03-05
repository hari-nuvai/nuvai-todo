import { NextRequest, NextResponse } from "next/server";
import { listCards, createCard } from "@/lib/db/tracking-queries";
import { audit } from "@/lib/audit";

export async function GET() {
  try {
    const data = await listCards();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const card = await createCard(body);
  await audit("CREATE", "card", card.id, {
    last4: card.last4,
    cardholderName: card.cardholderName,
  });
  return NextResponse.json(card, { status: 201 });
}
