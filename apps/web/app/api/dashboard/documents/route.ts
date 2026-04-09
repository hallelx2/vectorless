import { NextResponse } from "next/server";

// TODO: When Fastify API is running, proxy to it:
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";
// import { db } from "@/db";
// import { apiKeys } from "@/db/schema";
// import { eq } from "drizzle-orm";

export async function GET() {
  // TODO: Authenticate the user session and retrieve their API key
  // const session = await auth.api.getSession({ headers: await headers() });
  // if (!session) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }
  //
  // const userKey = await db.query.apiKeys.findFirst({
  //   where: eq(apiKeys.userId, session.user.id),
  // });
  //
  // const res = await fetch(`${process.env.VECTORLESS_API_URL}/documents`, {
  //   headers: { Authorization: `Bearer ${userKey?.keyHash}` },
  // });
  // const data = await res.json();
  // return NextResponse.json(data);

  // Mock data until Fastify API is ready
  return NextResponse.json({
    documents: [
      {
        doc_id: "f3a9c1b2",
        title: "Clinical Guidelines for Hypertension",
        source_type: "pdf",
        section_count: 18,
        status: "ready",
        created_at: "2025-04-08T10:22:00Z",
      },
      {
        doc_id: "a7b2e4d1",
        title: "Employment Contract Template",
        source_type: "docx",
        section_count: 12,
        status: "ready",
        created_at: "2025-04-07T14:30:00Z",
      },
      {
        doc_id: "c9d3f5e2",
        title: "Machine Learning Research Paper",
        source_type: "pdf",
        section_count: 8,
        status: "processing",
        created_at: "2025-04-08T11:15:00Z",
      },
    ],
    next_cursor: null,
    has_more: false,
  });
}
