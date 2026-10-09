import type { FeedbackPayload } from '../../types';
import { FEEDBACK_TEXT } from './text';

export const FEEDBACK_ENDPOINT = '/api/feedback';

export interface SendResult { ok: boolean; message: string }

/** Message affiché selon le code HTTP (0 = réseau injoignable). 404 / 502 / 503 / 504 : serveur d’avis absent. */
export const messageForStatus = (status: number): SendResult => {
  const m = FEEDBACK_TEXT.messages;
  switch (status) {
    case 201: case 200: return { ok: true, message: m.sent };
    case 400: return { ok: false, message: m.invalid };
    case 413: return { ok: false, message: m.tooBig };
    case 429: return { ok: false, message: m.tooMany };
    case 507: return { ok: false, message: m.full };
    case 0: case 404: case 502: case 503: case 504: return { ok: false, message: m.unavailable };
    default: return { ok: false, message: m.unknown };
  }
};

export const sendFeedback = async (payload: FeedbackPayload, fetchImpl: typeof fetch = fetch): Promise<SendResult> => {
  try {
    const res = await fetchImpl(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return messageForStatus(res.status);
  } catch {
    return messageForStatus(0);
  }
};
