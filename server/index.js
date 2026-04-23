import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requestGeminiReply } from './chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function loadEnvFile() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const equalsIndex = line.indexOf('=');
    if (equalsIndex <= 0) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const PORT = Number(process.env.CHAT_SERVER_PORT || 8787);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const RATE_LIMIT_PER_MINUTE = Number(process.env.CHAT_RATE_LIMIT_RPM || 10);
const RATE_LIMIT_PER_DAY = Number(process.env.CHAT_RATE_LIMIT_RPD || 20);
const RATE_LIMIT_TOKENS_PER_MINUTE = Number(process.env.CHAT_RATE_LIMIT_TPM || 250000);
const RATE_LIMIT_MINUTE_WINDOW_MS = Number(process.env.CHAT_RATE_LIMIT_MINUTE_WINDOW_MS || 60 * 1000);
const RATE_LIMIT_DAY_WINDOW_MS = Number(process.env.CHAT_RATE_LIMIT_DAY_WINDOW_MS || 24 * 60 * 60 * 1000);
const ESTIMATED_OUTPUT_TOKENS = Number(process.env.CHAT_ESTIMATED_OUTPUT_TOKENS || 450);
const MAX_BODY_BYTES = 30 * 1024;

const rateLimitStore = new Map();

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.socket.remoteAddress || 'unknown';
}

function getRateLimitState(ip, key, windowMs) {
  const now = Date.now();
  const existing = rateLimitStore.get(ip);
  const bucket = existing?.[key];

  if (!existing || !bucket || bucket.resetAt <= now) {
    const nextBucket = { count: 0, resetAt: now + windowMs };
    const nextState = {
      ...(existing ?? {}),
      [key]: nextBucket
    };
    rateLimitStore.set(ip, nextState);
    return nextBucket;
  }

  return bucket;
}

function useRateLimit(ip, estimatedTokens) {
  const safeEstimatedTokens = Math.max(1, Number.isFinite(estimatedTokens) ? Math.floor(estimatedTokens) : 1);
  const minuteBucket = getRateLimitState(ip, 'minute', RATE_LIMIT_MINUTE_WINDOW_MS);
  const dayBucket = getRateLimitState(ip, 'day', RATE_LIMIT_DAY_WINDOW_MS);
  const tokenMinuteBucket = getRateLimitState(ip, 'tokenMinute', RATE_LIMIT_MINUTE_WINDOW_MS);
  minuteBucket.count += 1;
  dayBucket.count += 1;
  tokenMinuteBucket.count += safeEstimatedTokens;

  const remainingMinute = Math.max(0, RATE_LIMIT_PER_MINUTE - minuteBucket.count);
  const remainingDay = Math.max(0, RATE_LIMIT_PER_DAY - dayBucket.count);
  const remainingTokensPerMinute = Math.max(0, RATE_LIMIT_TOKENS_PER_MINUTE - tokenMinuteBucket.count);
  const minuteLimited = minuteBucket.count > RATE_LIMIT_PER_MINUTE;
  const dayLimited = dayBucket.count > RATE_LIMIT_PER_DAY;
  const tokenMinuteLimited = tokenMinuteBucket.count > RATE_LIMIT_TOKENS_PER_MINUTE;
  const limited = minuteLimited || dayLimited || tokenMinuteLimited;
  const now = Date.now();
  const blockingResetTimes = [];
  if (minuteLimited) {
    blockingResetTimes.push(minuteBucket.resetAt);
  }
  if (dayLimited) {
    blockingResetTimes.push(dayBucket.resetAt);
  }
  if (tokenMinuteLimited) {
    blockingResetTimes.push(tokenMinuteBucket.resetAt);
  }
  const retryAfterMs =
    blockingResetTimes.length > 0 ? Math.max(0, Math.max(...blockingResetTimes) - now) : 0;

  const nextResetAt = Math.min(minuteBucket.resetAt, dayBucket.resetAt, tokenMinuteBucket.resetAt);

  return {
    limited,
    minuteLimited,
    dayLimited,
    tokenMinuteLimited,
    remainingMinute,
    remainingDay,
    remainingTokensPerMinute,
    resetAt: nextResetAt,
    resetAtMinute: minuteBucket.resetAt,
    resetAtDay: dayBucket.resetAt,
    resetAtTokenMinute: tokenMinuteBucket.resetAt,
    retryAfterMs
  };
}

function writeJson(res, statusCode, data, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...extraHeaders
  });
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (_error) {
        reject(new Error('Invalid JSON body.'));
      }
    });

    req.on('error', reject);
  });
}

function normalizeCareerMatches(rawCareerMatches) {
  if (!Array.isArray(rawCareerMatches)) {
    return [];
  }

  return rawCareerMatches
    .slice(0, 6)
    .map((entry) => ({
      title: String(entry?.title ?? '').trim(),
      highlights: Array.isArray(entry?.highlights)
        ? entry.highlights.map((line) => String(line ?? '').trim()).filter(Boolean).slice(0, 4)
        : []
    }))
    .filter((entry) => entry.title);
}

function estimateTokenCount({ message, history, topTraits, careerMatches }) {
  const historyText = Array.isArray(history)
    ? history
        .slice(-10)
        .map((entry) => String(entry?.content ?? ''))
        .join('\n')
    : '';
  const traitsText = Array.isArray(topTraits) ? topTraits.join('\n') : '';
  const matchesText = Array.isArray(careerMatches)
    ? careerMatches
        .map((entry) => {
          const title = String(entry?.title ?? '');
          const highlights = Array.isArray(entry?.highlights) ? entry.highlights.join('\n') : '';
          return `${title}\n${highlights}`;
        })
        .join('\n')
    : '';

  const combinedText = [String(message ?? ''), historyText, traitsText, matchesText].join('\n');
  const inputTokens = Math.ceil(combinedText.length / 4);
  return Math.max(1, inputTokens + ESTIMATED_OUTPUT_TOKENS);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    writeJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    writeJson(res, 200, { ok: true });
    return;
  }

  if (req.method !== 'POST' || url.pathname !== '/api/chat') {
    writeJson(res, 404, { error: 'Not found.' });
    return;
  }

  if (!GEMINI_API_KEY) {
    writeJson(res, 503, { error: 'Chat service is not configured.' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const message = String(body?.message ?? '').trim();
    const history = Array.isArray(body?.history) ? body.history : [];
    const topTraits = Array.isArray(body?.topTraits)
      ? body.topTraits.map((trait) => String(trait ?? '').trim()).filter(Boolean).slice(0, 6)
      : [];
    const careerMatches = normalizeCareerMatches(body?.careerMatches);

    if (!message) {
      writeJson(res, 400, { error: 'Message is required.' });
      return;
    }

    if (message.length > 1500) {
      writeJson(res, 400, { error: 'Message is too long.' });
      return;
    }

    const ip = getClientIp(req);
    const estimatedTokens = estimateTokenCount({ message, history, topTraits, careerMatches });
    const rateState = useRateLimit(ip, estimatedTokens);

    if (rateState.limited) {
      const exceededLabel = rateState.dayLimited
        ? 'daily'
        : rateState.tokenMinuteLimited
          ? 'token-per-minute'
          : 'per-minute';
      writeJson(
        res,
        429,
        {
          error: `Rate limit exceeded (${exceededLabel}). Please wait and try again.`,
          retryAfterMs: rateState.retryAfterMs
        },
        {
          'Retry-After': String(Math.ceil(rateState.retryAfterMs / 1000)),
          'X-RateLimit-Minute-Limit': String(RATE_LIMIT_PER_MINUTE),
          'X-RateLimit-Minute-Remaining': String(rateState.remainingMinute),
          'X-RateLimit-Minute-Reset': String(rateState.resetAtMinute),
          'X-RateLimit-Day-Limit': String(RATE_LIMIT_PER_DAY),
          'X-RateLimit-Day-Remaining': String(rateState.remainingDay),
          'X-RateLimit-Day-Reset': String(rateState.resetAtDay),
          'X-RateLimit-Token-Minute-Limit': String(RATE_LIMIT_TOKENS_PER_MINUTE),
          'X-RateLimit-Token-Minute-Remaining': String(rateState.remainingTokensPerMinute),
          'X-RateLimit-Token-Minute-Reset': String(rateState.resetAtTokenMinute)
        }
      );
      return;
    }

    const reply = await requestGeminiReply({
      apiKey: GEMINI_API_KEY,
      model: GEMINI_MODEL,
      message,
      history,
      topTraits,
      careerMatches
    });

    writeJson(
      res,
      200,
      {
        reply,
        remainingRequests: Math.min(rateState.remainingMinute, rateState.remainingDay),
        remainingPerMinute: rateState.remainingMinute,
        remainingPerDay: rateState.remainingDay,
        remainingTokensPerMinute: rateState.remainingTokensPerMinute,
        resetAtMs: rateState.resetAt
      },
      {
        'X-RateLimit-Minute-Limit': String(RATE_LIMIT_PER_MINUTE),
        'X-RateLimit-Minute-Remaining': String(rateState.remainingMinute),
        'X-RateLimit-Minute-Reset': String(rateState.resetAtMinute),
        'X-RateLimit-Day-Limit': String(RATE_LIMIT_PER_DAY),
        'X-RateLimit-Day-Remaining': String(rateState.remainingDay),
        'X-RateLimit-Day-Reset': String(rateState.resetAtDay),
        'X-RateLimit-Token-Minute-Limit': String(RATE_LIMIT_TOKENS_PER_MINUTE),
        'X-RateLimit-Token-Minute-Remaining': String(rateState.remainingTokensPerMinute),
        'X-RateLimit-Token-Minute-Reset': String(rateState.resetAtTokenMinute)
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to complete chat request.';
    console.error('[chat-server] chat request failed:', message);
    writeJson(res, 502, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`[chat-server] listening on http://127.0.0.1:${PORT}`);
});
