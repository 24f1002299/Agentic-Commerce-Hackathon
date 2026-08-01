import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/stream/audit?ruleId=<id>
 *
 * Server-Sent Events endpoint that streams AuditLog rows for a given rule
 * in real-time as the autonomous execution engine writes them to the DB.
 *
 * Protocol:
 *  - event: "log"    → a new AuditLog entry (JSON)
 *  - event: "status" → the rule's current status string
 *  - event: "done"   → stream closed (terminal state reached)
 *  - event: "error"  → error message string
 *
 * The stream closes automatically when the rule reaches a terminal state
 * (SUCCESS, FAILED) or after a 90-second safety timeout.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ruleId = searchParams.get('ruleId');

  if (!ruleId) {
    return new Response('Missing ruleId query parameter', { status: 400 });
  }

  const encoder = new TextEncoder();
  const POLL_INTERVAL_MS = 1200;
  const MAX_DURATION_MS = 90_000; // 90 s safety timeout

  let closed = false;
  const seenLogIds = new Set<string>();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        const payload =
          typeof data === 'string' ? data : JSON.stringify(data);
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${payload}\n\n`),
        );
      };

      // Immediately confirm connection is live
      controller.enqueue(encoder.encode(': connected\n\n'));

      const startedAt = Date.now();

      const poll = async () => {
        if (closed) return;

        try {
          // Fetch rule status
          const rows = await prisma.$queryRawUnsafe<{ status: string }[]>(
            `SELECT status FROM "Rule" WHERE id = '${ruleId}' LIMIT 1;`,
          );

          if (!rows || rows.length === 0) {
            send('error', `Rule ${ruleId} not found`);
            controller.close();
            closed = true;
            return;
          }

          const status = rows[0].status as string;
          send('status', status);

          // Fetch all audit logs for this rule, ordered oldest-first
          const logs = await prisma.$queryRawUnsafe<
            {
              id: string;
              ruleId: string;
              action: string;
              timestamp: string;
              pravaSessionId: string | null;
              receiptUrl: string | null;
              uiIcon: string;
            }[]
          >(
            `SELECT id, ruleId, action, timestamp, pravaSessionId, receiptUrl, uiIcon
             FROM "AuditLog"
             WHERE ruleId = '${ruleId}'
             ORDER BY timestamp ASC;`,
          );

          // Emit only newly-seen logs
          for (const log of logs) {
            if (!seenLogIds.has(log.id)) {
              seenLogIds.add(log.id);
              send('log', {
                ...log,
                timestamp: String(log.timestamp),
              });
            }
          }

          // Close stream on terminal states or timeout
          const isTerminal = ['SUCCESS', 'FAILED'].includes(status);
          const timedOut = Date.now() - startedAt > MAX_DURATION_MS;

          if (isTerminal || timedOut) {
            send('done', isTerminal ? status : 'timeout');
            controller.close();
            closed = true;
            return;
          }

          // Schedule next poll
          setTimeout(poll, POLL_INTERVAL_MS);
        } catch (err: any) {
          console.error('[SSE /api/stream/audit] poll error:', err);
          send('error', err.message || 'Internal poll error');
          controller.close();
          closed = true;
        }
      };

      // First poll after a short delay so the client is ready
      setTimeout(poll, 300);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
