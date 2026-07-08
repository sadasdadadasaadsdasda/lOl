"use strict";
var _a;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const node_fs = require("node:fs");
const node_readline = require("node:readline");
function postToParent(port, message) {
  try {
    port.postMessage(message);
  } catch {
  }
}
const SNIPPET_RADIUS = 80;
const SCAN_CONCURRENCY = 4;
function buildPrefilter(needle) {
  const tokens = needle.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }
  for (const t of tokens) {
    if (/["\\]|[^\x20-\x7e]/.test(t)) {
      return null;
    }
  }
  const regexes = tokens.map(
    (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "iu")
  );
  return (line) => {
    if (regexes.every((re) => re.test(line))) {
      return true;
    }
    if (!line.includes("İ")) {
      return false;
    }
    const lower = line.toLowerCase();
    return tokens.every((tok) => lower.includes(tok));
  };
}
function extractText(content) {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    let out = "";
    for (const block of content) {
      if (block && typeof block === "object" && block.type === "text" && typeof block.text === "string") {
        out += block.text + " ";
      }
    }
    return out;
  }
  return "";
}
function makeSnippet(text, idx, qLen) {
  const start = Math.max(0, idx - SNIPPET_RADIUS);
  const end = Math.min(text.length, idx + qLen + SNIPPET_RADIUS);
  const slice = text.slice(start, end).trim();
  return (start > 0 ? "…" : "") + slice + (end < text.length ? "…" : "");
}
async function scanFile(session, needle, messageTypes, prefilter) {
  var _a2;
  let snippet = null;
  const stream = node_fs.createReadStream(session.transcriptPath, { encoding: "utf8" });
  const rl = node_readline.createInterface({ input: stream, crlfDelay: Infinity });
  try {
    for await (const line of rl) {
      if (!line) {
        continue;
      }
      if (prefilter && !prefilter(line)) {
        continue;
      }
      let parsed;
      try {
        parsed = JSON.parse(line);
      } catch {
        continue;
      }
      if (!parsed.type || !messageTypes.has(parsed.type)) {
        continue;
      }
      const text = extractText((_a2 = parsed.message) == null ? void 0 : _a2.content);
      if (!text) {
        continue;
      }
      const normalized = text.replace(/\s+/g, " ");
      const idx = normalized.toLowerCase().indexOf(needle);
      if (idx === -1) {
        continue;
      }
      snippet = makeSnippet(normalized, idx, needle.length);
      break;
    }
  } finally {
    rl.close();
    stream.destroy();
  }
  if (snippet === null) {
    return null;
  }
  return {
    sessionId: session.sessionId,
    snippet,
    lastActivityAt: session.lastActivityAt
  };
}
async function handleSearch(port, req) {
  const needle = req.query.replace(/\s+/g, " ").trim().toLowerCase();
  const messageTypes = new Set(req.messageTypes);
  const prefilter = buildPrefilter(needle);
  const hits = [];
  const inputOrder = new Map(req.sessions.map((s, i) => [s.sessionId, i]));
  let nextIndex = 0;
  const inFlight = /* @__PURE__ */ new Set();
  const launchNext = () => {
    if (hits.length >= req.limit || nextIndex >= req.sessions.length) {
      return;
    }
    const session = req.sessions[nextIndex++];
    const p = scanFile(session, needle, messageTypes, prefilter).then((hit) => {
      if (hit) {
        hits.push(hit);
      }
    }).catch(() => {
    }).finally(() => {
      inFlight.delete(p);
      launchNext();
    });
    inFlight.add(p);
  };
  for (let i = 0; i < SCAN_CONCURRENCY; i++) {
    launchNext();
  }
  while (inFlight.size > 0) {
    await Promise.race(inFlight);
  }
  hits.sort(
    (a, b) => b.lastActivityAt - a.lastActivityAt || (inputOrder.get(a.sessionId) ?? 0) - (inputOrder.get(b.sessionId) ?? 0)
  );
  postToParent(port, {
    type: "result",
    requestId: req.requestId,
    hits: hits.slice(0, req.limit)
  });
}
(_a = process.parentPort) == null ? void 0 : _a.once("message", (e) => {
  var _a2;
  if (e.data.type !== "init" || !((_a2 = e.ports) == null ? void 0 : _a2[0])) {
    process.exit(1);
  }
  const port = e.ports[0];
  port.on("message", (event) => {
    const data = event.data;
    if (data.type === "search") {
      handleSearch(port, data).catch((error) => {
        const message = error instanceof Error ? error.message : "Unknown error";
        postToParent(port, {
          type: "error",
          requestId: data.requestId,
          message
        });
      });
    }
  });
  port.start();
});
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
const _test = {
  buildPrefilter,
  scanFile,
  handleSearch,
  SCAN_CONCURRENCY
};
exports._test = _test;
