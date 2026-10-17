import { NextRequest } from "next/server";
import { handleToolExecution } from "@/tool-engine/wrapper";

export async function POST(req: NextRequest) {
  return handleToolExecution(req);
}

export async function GET(req: NextRequest) {
  return handleToolExecution(req);
}
