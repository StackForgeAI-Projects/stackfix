import { logger } from "../lib/logger.js";

const GRAPH_BASE = "https://graph.facebook.com";
const DEFAULT_API_VERSION = "v21.0";

/**
 * WhatsApp Cloud API (Meta) text sender.
 *
 * When WHATSAPP_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID are not configured the
 * message is logged instead of sent, so local/dev never fails. In production
 * the token, phone number id and (for messages outside the 24h service window)
 * approved message templates must be configured on the Meta side.
 */
export class WhatsAppService {
  async sendText(params: { to: string; body: string }): Promise<{ id?: string }> {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const version = process.env.WHATSAPP_API_VERSION ?? DEFAULT_API_VERSION;

    if (!token || !phoneNumberId) {
      logger.info("WhatsApp (dev mode — not configured)", {
        to: params.to,
        preview: params.body.slice(0, 160),
      });
      return {};
    }

    const res = await fetch(`${GRAPH_BASE}/${version}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: params.to,
        type: "text",
        text: { preview_url: false, body: params.body },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`WhatsApp API ${res.status}: ${detail}`);
    }

    const data = (await res.json()) as { messages?: Array<{ id: string }> };
    return { id: data.messages?.[0]?.id };
  }
}

export const whatsappService = new WhatsAppService();
