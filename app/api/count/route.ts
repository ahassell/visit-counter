import { NextResponse } from "next/server";
import redis from "@/lib/redis";

const COUNTER_KEY = "visit:count";

export async function GET() {
  const count = await redis.get(COUNTER_KEY);
  return NextResponse.json({ count: Number(count ?? 0) });
}

export async function POST() {
  const count = await redis.incr(COUNTER_KEY);
  return NextResponse.json({ count });
}
