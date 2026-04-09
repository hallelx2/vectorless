import type { FastifyRequest, FastifyReply } from "fastify";
import { Receiver } from "@upstash/qstash";
import { config } from "../config.js";
import { unauthorized } from "./error-handler.js";

const receiver = new Receiver({
  currentSigningKey: config.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: config.QSTASH_NEXT_SIGNING_KEY,
});

export async function verifyQStashSignature(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const signature = request.headers["upstash-signature"] as string;
  if (!signature) {
    throw unauthorized("Missing QStash signature");
  }

  try {
    const body =
      typeof request.body === "string"
        ? request.body
        : JSON.stringify(request.body);

    await receiver.verify({
      signature,
      body,
      url: `${config.API_BASE_URL}${request.url}`,
    });
  } catch {
    throw unauthorized("Invalid QStash signature");
  }
}
