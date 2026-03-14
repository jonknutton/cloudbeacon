# Memento_Reconstruction
**Generated:** 2026-03 | **Source:** Memento2.md | **Purpose:** Full extrapolation — stated + inferred

---

## 1. PROJECT OVERVIEWS

### 1.1 CloudBeacon

**What it is (inferred):** A web platform with social/community features. The data model (users, projects, activities, votes, posts, bids) strongly implies a marketplace or freelance/collaboration platform — users post projects, others bid on them, vote on content, and post activity. Think: a lightweight Upwork/ProductHunt hybrid.

**Stack (inferred + stated):**
- Frontend: JavaScript, likely React or vanilla JS given `page.js` conventions and `src/features/*/page.js` path structure
- Backend: Firebase (Firestore for collections, Firebase CDN for hosting)
- CI/CD: GitHub Actions → Firebase CDN, deploy time 1–2 minutes
- Entry point: `app.js`

**Directory structure:**
```
app.js
src/
  features/       ← page-level feature modules (each with page.js)
  services/       ← shared service layer (e.g. ActivityService.js)
  ui/             ← reusable UI components
  utils/          ← helper functions
  data/           ← data access layer / Firestore queries
  tools/          ← utility tooling
```

**Collections (Firestore):**
- `users` — user profiles
- `projects` — project listings
- `activities` — denormalized activity log (the core read-optimization mechanism)
- `votes` — voting records
- `posts` — content posts
- `bids` — project bids

**The core architectural insight — DENORM:**
The original system queried profiles by joining/scanning collections, resulting in O(n²) complexity and 30–60 second load times. The fix was a write-time denormalization: every user action (vote, post, bid, comment) is logged as an `activity` document. Reads then use `orderBy('timestamp', 'desc').limit(k)` — a simple indexed query — bringing load times to 50–100ms. This is a classic Firebase/NoSQL pattern: accept write overhead to make reads trivial.

**Import path constraint:**
Files at `src/features/X/Y/file.js` (depth 4 from root, inside a feature subfolder) must use `../../../` (3 levels up) to reach `src/services/`. This was a recurring source of MIME/module-not-found errors when developers miscounted depth. The rule: `depth_from_src + 1` — since `features/X/Y/` is 3 levels deep within `src/`, the import back to `src/services/` requires exactly 3 `../` segments.

---

### 1.2 Handy3

**What it is (inferred):** A Windows desktop AI automation agent. It takes screenshots, analyzes the screen state, sends structured context to an AI provider, receives instructions, and executes mouse/keyboard/system actions. It's a general-purpose "AI sees screen, AI does things" loop — like a personal RPA (Robotic Process Automation) tool powered by LLMs.

**Stack:**
- Language: Python ≤3.12
- OS: Windows (Win32 API usage confirmed)
- AI providers: Claude API, ChatGPT API, GitHub Copilot (via factory pattern)

**Core flow:**
```
screenshot → state.json (ai_input.json) → AI provider → output.json (ai_output.json) → exec → feedback → loop
```

1. **Screenshot** — capture current screen state
2. **State assembly** — build `ai_input.json` with goal, screen dims, detected UI elements, recent actions, feedback
3. **AI call** — send to configured provider (Claude/ChatGPT/Copilot)
4. **Output parse** — read `ai_output.json` for next action
5. **Execute** — mouse click, keyboard input, system command
6. **Feedback** — log result back into state for next iteration

**File structure:**
```
ai_signals.py          ← orchestrator / main loop
engine.py              ← core execution engine
vision.py              ← screen analysis (T1/T2/T3 tiers)
state_engine.py        ← state management, file I/O
bridge_claude.py       ← Claude API adapter
bridge_chatgpt.py      ← ChatGPT API adapter
bridge_copilot.py      ← Copilot adapter
mouse.py               ← mouse control
keyboard.py            ← keyboard input
system.py              ← system-level commands
```

**Provider selection:** Factory pattern driven by config file — swap provider by changing config, not code.

---

## 2. DESIGN PATTERNS — FULL DETAIL

### 2.1 DENORM (Denormalization)
- **Problem:** User profile pages required aggregating data across multiple Firestore collections. Each profile load triggered O(n²) queries — scanning activities, votes, posts per user. At scale: 30–60 seconds.
- **Solution:** On every write action (post, vote, comment, bid), call `ActivityService.log(userId, contentId, type, metadata)`. This creates a flat `activities` document. Profile reads then do a single `orderBy('timestamp','desc').limit(k)` query.
- **Result:** 300–1000x speedup. 30–60s → 50–100ms.
- **Tradeoff:** Write-heavy. Every action = 2 writes (primary + activity log). Acceptable because reads vastly outnumber writes in social platforms.
- **Inference:** This also enables an audit trail, activity feeds, and notification systems as free side effects of the denorm log.

### 2.2 BRIDGE (Multi-provider abstraction)
- **Problem:** Hardcoding a single AI provider creates a brittle dependency. Switching providers requires rewriting integration code.
- **Solution:** Abstract base class `BridgeBase` with interface: `send_state(state) → wait_response() → read_response()`. Each provider implements this. Factory reads config to instantiate correct bridge.
- **Adding a provider:**
  ```python
  class BridgeNewProvider(BridgeBase):
      def send_state(self, s): ...
      def wait_response(self): ...
      def read_response(self): ...
  ```
- **Inference:** The config factory likely reads an env var or config.json key like `AI_PROVIDER=claude`. This means zero-code provider switching in production.

### 2.3 CONF (Confidence gating)
- **Problem:** AI automation acting on uncertain state destroys user trust. A wrong click is worse than no click.
- **Solution:** Every detection/action carries a confidence score 0–100.
  - ≥70: execute
  - 40–69: gate (prompt user for confirmation)
  - 30–39: warn/prompt strongly
  - <30: refuse entirely, return error state
- **Inference:** This confidence score system is self-reinforcing — once users see it working, they trust the system. Removing it later would break that trust. Hence: "easy to add, impossible to remove. Day1."
- **Integration point:** `CONFIDENCE_GATE` is a code template — centralized check before any execution.

### 2.4 STATE_FILES (File-based state protocol)
- **Problem:** Clipboard-based data transfer between AI and execution layer was fragile and could interfere with user clipboard. Base64 encoding images into JSON caused ~230K token overflow (200x cost explosion).
- **Solution:** Two JSON files as the communication protocol:
  - `ai_input.json` — assembled before each AI call, <50KB hard limit
  - `ai_output.json` — written by AI, read by executor
- **Why files:** Reproducible (can replay any turn), debuggable (inspect JSON directly), non-interfering (no clipboard), version-controllable.
- **Hard constraint:** NEVER embed base64 images in these files. Use binary clipboard or file references (path strings) only.

### 2.5 POLLING (Adaptive polling)
- **Problem:** Fixed 10-second polling killed performance on fast actions and timed out on slow AI reasoning (which can take minutes).
- **Solution:** Poll every 1 second. Return immediately when result is ready. Maximum wait: 15 minutes.
- **Inference:** This is likely watching for `ai_output.json` to appear or be modified (file watcher or mtime check). The 15-minute max handles worst-case reasoning chains while the 1s poll handles sub-second responses.

### 2.6 VISION_TIERS (Tiered visual detection)
- **Problem:** Mandating AI vision (T3) for every frame costs ~50 tokens/turn minimum, often much more. At scale this becomes $50/turn equivalent.
- **Solution:** Three-tier cascade:
  - **T1 — CDP (Chrome DevTools Protocol):** Free. Query browser DOM directly. Works 99% of the time for browser automation. $0/turn.
  - **T2 — Python CV:** OpenCV or similar. Detects UI elements, buttons, forms via pixel analysis. Works 75–90% of cases. $0/turn.
  - **T3 — AI Vision:** Send screenshot to AI provider. 50 tokens/call. Only if T1+T2 fail.
- **Result:** Average cost drops to ~$0.001/turn (200,000x reduction from naive T3-always approach).
- **Rule:** Never call T3 unless T1 and T2 have both been attempted and failed.

### 2.7 LOG_FEEDBACK (Anti-loop feedback)
- **Problem:** Without memory of recent actions, AI repeatedly attempts the same failing action (e.g. clicking a button 5 times that isn't responding).
- **Solution:** `state.recent_actions` array in `ai_input.json` — last N actions with `{action, success, result}`. Plus `action_feedback` field for explicit loop-breaking messages.
- **Inference:** The feedback loop effectively gives the AI a short-term memory per session, even if the underlying model is stateless. This is lightweight but solves the most expensive failure mode (infinite retry loops consuming tokens and time).

---

## 3. SCHEMA — FULL RECONSTRUCTION

### 3.1 ai_input.json (complete inferred schema)
```json
{
  "goal": "string — the high-level task the user wants to accomplish",
  "instructions": "string — specific step instructions for this turn",
  "turn": "integer — current turn number in the session",
  "screen": {
    "w": "integer — screen width in pixels",
    "h": "integer — screen height in pixels",
    "dpi": "number — screen DPI/scaling factor"
  },
  "detection_summary": "string — human-readable summary of what was detected",
  "detections": {
    "browser_tabs": ["array of detected tab titles/URLs"],
    "ui_elements": ["array of detected buttons, inputs, links"],
    "grid": "detected grid/table structure if present",
    "bars": "detected toolbars, menubars, taskbars"
  },
  "methods_used": ["T1_CDP", "T2_python_cv"],
  "available_tools": ["mouse_click", "keyboard_type", "system_command"],
  "recent_actions": [
    {
      "action": "string — what was attempted",
      "success": "boolean",
      "result": "string — outcome description"
    }
  ],
  "action_feedback": "string — explicit feedback to break loops or redirect",
  "state_description": "string — overall current state of the screen/session"
}
```
**Hard constraints:** <50KB total. No base64 image data. All image references as file paths only.

### 3.2 ai_output.json (inferred schema)
```json
{
  "action": "string — action type: mouse_click | keyboard_type | system_command | wait | done",
  "parameters": {
    "x": "integer — screen x coordinate (for mouse)",
    "y": "integer — screen y coordinate (for mouse)",
    "text": "string — text to type (for keyboard)",
    "command": "string — system command",
    "duration": "number — wait duration in seconds"
  },
  "confidence": "number 0-100 — confidence in this action",
  "reasoning": "string — brief explanation of why this action",
  "next_state_expectation": "string — what the screen should look like after action"
}
```

### 3.3 Activity document (Firestore)
```json
{
  "userId": "string — Firebase UID",
  "contentId": "string — ID of the content acted upon",
  "type": "enum: post | vote | comment | bid",
  "metadata": {
    "projectId": "optional — for bids/votes on projects",
    "voteDirection": "optional — up/down for votes",
    "commentText": "optional — for comments",
    "bidAmount": "optional — for bids"
  },
  "timestamp": "ISO8601 string — e.g. 2026-03-01T12:00:00Z"
}
```

---

## 4. FAILURE REGISTRY — FULL DETAIL

### F1: base64_img overflow
- **Symptom:** Token count explodes to ~230K on a turn. API cost spikes. Context window exceeded.
- **Root cause:** AI output included base64-encoded screenshot data embedded directly in `ai_output.json`.
- **Why it happens:** Convenient to embed, but a PNG screenshot encodes to ~150–200KB base64, which tokenizes at roughly 1 token per character → 200K+ tokens.
- **Fix:** Never embed base64 in any JSON file. Use binary clipboard transfer OR write image to disk and pass file path as string reference.
- **Prevention:** Linter/validator on `ai_output.json` that rejects any field value longer than X characters.

### F2: pathDepth (MIME/import errors)
- **Symptom:** `Cannot find module`, MIME type errors, broken imports in CloudBeacon frontend.
- **Root cause:** Developer counted import depth as 2 (`../../`) when it should be 3 (`../../../`).
- **Why it happens:** `src/features/X/Y/file.js` — easy to count from `features/` (2 deep) instead of from `src/` (3 deep).
- **Fix:** Always count from `src/` root. `features/X/Y/` = 3 levels → `../../../services/`.
- **Rule:** `import depth = directory depth within src/`

### F3: eagerVision
- **Symptom:** Every automation turn costs 50–100 tokens minimum, session costs balloon.
- **Root cause:** Vision was mandated on every frame regardless of whether it was needed.
- **Fix:** Implement T1→T2→T3 cascade. Only call AI vision (T3) when programmatic methods fail.

### F4: monologue (AI loop)
- **Symptom:** AI repeats the same action 5+ times. No progress. Tokens consumed with no value.
- **Root cause:** `recent_actions` field missing from state. AI has no memory of what it already tried.
- **Fix:** Add `recent_actions: [{action, success, result}]` and `action_feedback` to every `ai_input.json`.
- **Inference:** The fix costs ~200–500 tokens per turn (the action history) but saves thousands by breaking loops.

### F5: generalAI (chaotic UI paralysis)
- **Symptom:** AI agent enters 10K+ token reasoning loops trying to automate social feeds, chat interfaces, or other dynamically-updating UIs.
- **Root cause:** Dynamic/chaotic UIs have unpredictable structure. Element positions change frame-to-frame. AI can't form reliable action plans.
- **Fix:** Whitelist only structured UIs (forms, spreadsheets, terminals, APIs, config panels). Refuse automation on chaotic UIs (<50% reliability matrix).
- **Inference:** The cost of attempting chaotic UIs is not just direct token cost — it's the downstream errors, user trust loss, and debugging time.

### F6: py313 (Python 3.13 incompatibility)
- **Symptom:** `pip install` fails for key packages. Wheels not available.
- **Root cause:** Python 3.13 released; ecosystem hasn't caught up. Many packages lack compiled wheels for 3.13.
- **Fix:** Use Python ≤3.12. Treat new Python versions as "1–2 year ecosystem lag."
- **Inference:** This is particularly acute for packages with C extensions (numpy, opencv, pywin32). Pure-Python packages usually work, but any package with native bindings will fail.

### F7: clipboard fragility
- **Symptom:** Automation intermittently fails or corrupts user's clipboard content.
- **Root cause:** Using clipboard as data transfer mechanism between AI and executor.
- **Fix:** File protocol — write to `ai_input.json` / `ai_output.json`, read back. Zero clipboard interference.

---

## 5. UI RELIABILITY MATRIX — FULL ANALYSIS

| UI Type | Reliability | Why reliable/unreliable |
|---------|-------------|------------------------|
| API endpoints | 99% | Structured, deterministic, no visual parsing needed |
| Config panels | 98% | Static layout, labeled fields, predictable |
| Multi-turn dialog | 95% | Structured state machine, predictable flow |
| Terminal/CLI | 92% | Text-only, predictable output format |
| Forms | 94% | Static structure, labeled inputs |
| Spreadsheets | 87% | Grid structure, addressable cells |
| Social feeds | 45% | Dynamic, infinite scroll, algorithmic ordering |
| Chat interfaces | 45% | Real-time updates, variable layouts |
| Social/community UIs | 35% | Most chaotic — reactions, embeds, dynamic content |

**The whitelist rule:** Only automate UIs with ≥70% reliability. Below 70%, gate. Below 50%, refuse.
**Inference:** The 70% threshold aligns with the confidence gating system — a UI type that's only reliable 50% of the time means even a "confident" AI action has a coin-flip chance of being wrong.

---

## 6. PROVIDER COMPARISON — FULL ANALYSIS

| Provider | Vision | Speed | Cost | Reliability | Notes |
|----------|--------|-------|------|-------------|-------|
| Claude API | Native | 3–10s | ~$0.001/turn | 95% | Default. Best reliability. |
| ChatGPT API | Native | 3–10s | ~$0.001/turn | 94% | Near-equivalent to Claude. |
| Copilot | In-editor | Variable | $0/turn | 80% | Manual trigger. IDE context. |
| ChatGPT-Se | File upload | 5–15s | ~$0.001/turn | 85% | Fragile — UI-dependent. |

**Inference on "ChatGPT-Se":** This is likely "ChatGPT Search" or the ChatGPT web interface used via UI automation rather than the API — hence "file upload" as vision method and "fragile" classification. It's being driven as a UI, not an API.

**Why Claude is default:** Highest reliability (95%) with native vision at competitive cost. The BRIDGE pattern means swapping is trivial if this changes.

---

## 7. PERFORMANCE GAINS — CONTEXTUALIZED

| Metric | Before | After | Factor | Mechanism |
|--------|--------|-------|--------|-----------|
| Profile load | 30–60s | 50–100ms | 300–1000x | DENORM pattern |
| Query complexity | O(n²) | O(1) orderBy | n²→k | Activity log indexed query |
| Vision cost | 230K tokens | $0.001/turn | 200,000x | T1→T2→T3 tier cascade |
| Path errors | 8 MIME errors | 0 | 100% | Path depth rule enforced |
| AI timeout | 30s (fails) | 60s (wins) | works | Reasoning needs time |
| Deploy | Manual | 1–2m auto | ∞ | GH Actions → Firebase |

---

## 8. INVARIANTS — REASONING

1. **Activities MUST have {userId, contentId, type, metadata, ts}** — Without userId, can't build user feeds. Without contentId, can't aggregate per-content. Without type, can't filter. Without ts, can't orderBy. All 5 fields are load-bearing.

2. **ai_input.json MUST NOT contain b64 images** — Hard token limit. 230K token overflow is not recoverable mid-session.

3. **Path depth MUST be ../../../ for src/features/*/page.js** — MIME errors are silent failures in some bundlers. Enforcing this prevents a whole class of intermittent bugs.

4. **AI timeout MUST be ≥60s** — Reasoning models (especially chain-of-thought) legitimately need 30–90 seconds. A 30s timeout fails valid responses.

5. **Confidence: <40%→GATE, <30%→REFUSE** — Trust architecture. User knows system is uncertain. Builds long-term trust over hiding failures.

6. **Handy3 MUST support ≥3 providers via BRIDGE** — Vendor lock-in is an existential risk for a tool dependent on external AI APIs. 3+ providers = leverage and resilience.

7. **Vision: T1+T2 BEFORE T3** — Cost control. T3 at scale is economically unviable.

8. **Win32 SetForegroundWindow on Windows** — `pygetwindow` has known reliability issues on Windows for foreground focus. Win32 API call is the authoritative method.

9. **State files MUST be <50KB** — Token overflow safeguard. Enforces discipline in what gets included in context.

---

## 9. LESSONS — EXPANDED

1. **Monolithic first, then modular** — Starting with a working monolith and extracting modules (via BRIDGE pattern) is more reliable than designing modular from day 1 with unknown interfaces.

2. **Base64 = invisible killer** — The failure is silent until it suddenly costs 200x. There's no warning; context just overflows.

3. **File protocol > UI automation (10:1)** — Structured file I/O has ~99% reliability. UI automation averages ~70% even on good UIs. For data transfer, always prefer files.

4. **Tiered detection > mandating AI** — Vision tiers save orders-of-magnitude cost. The principle generalizes: use the cheapest sufficient tool first.

5. **Feedback loop = 1000 tokens of reasoning** — A small `recent_actions` array (maybe 500 tokens) prevents loops that would cost 10,000+ tokens. Asymmetric value.

6. **Confidence score: Day 1, not later** — Adding it retroactively requires changing every execution path. Designing it in from the start is trivial by comparison.

7. **Python: assume 1–2 year lag for new versions** — Especially true for packages with C extensions. Never use a Python version less than 1 year old for production automation tools.

8. **UI structure > AI capability** — A structured form with 94% reliability beats a "smart" AI trying to navigate a 35%-reliable social UI. The bottleneck is the interface, not the model.

9. **Denormalization pays off** — The write cost (2x writes per action) is negligible compared to the read gain (300–1000x). In read-heavy systems, always consider denorm.

10. **Bridge pattern = year-2 survival** — Hardcoded AI provider integrations become liabilities as models improve, pricing changes, and APIs evolve. The bridge pattern makes the system model-agnostic.

11. **Transparency > hiding failures** — Showing confidence scores and refusing uncertain actions builds more user trust than silently attempting and occasionally catastrophically failing.

12. **Lazy loading ≠ fast** — If profile loading triggers lazy loading of many sub-components, perceived latency is 50x worse than a single eager load of denormalized data.

13. **DRY prompts** — Duplicated prompt text means editing the prompt requires finding and updating multiple places. One change silently missed = prompt drift.

---

## 10. TODO / ROADMAP STATUS

### Ready to implement:
- **MCPs persistent memory** — MCP (Model Context Protocol) server for persistent cross-session memory. Likely: a local or remote store that Handy3 queries at session start to restore context. This is directly related to the Memento experiment itself.
- **External archive** — Longer-term storage beyond session state files.
- **Auto-moderation** — Likely for CloudBeacon: automated moderation of posts/bids.

### Blocked:
- **EM_App** — Awaiting Python 3.12 environment stabilization.
- **Handy3 gameplay** — Blocked on vision tools being fully stable.

### Proven (validated):
- DENORM: 300x confirmed
- BRIDGE: scales to multiple providers
- Files: reliable vs clipboard
- Confidence gating: safe and trust-building

---

## 11. BREADCRUMB CROSS-REFERENCE

| Symptom | Primary Pattern | Schema Field | Failure ID |
|---------|----------------|--------------|------------|
| 230K token overflow | STATE_FILES | ai_input.json (no b64) | base64_img |
| MIME/module not found | pathDepth rule | — | pathDepth |
| AI repeats action | LOG_FEEDBACK | recent_actions, action_feedback | monologue |
| pip install fails | py313 constraint | — | py313 |
| Automation unreliable | UI reliability matrix | — | generalAI |
| Window won't focus | Win32 invariant | — | window_focus |
| Profile loads slow | DENORM pattern | activities collection | — |
| High vision cost | VISION_TIERS | methods_used | eagerVision |
| Clipboard corruption | STATE_FILES | — | clipboard |
| AI times out | timeout ≥60s invariant | — | — |

---

## 12. INFERRED CONTEXT: THE MEMENTO EXPERIMENT

The Memento2.md file itself is a **meta-artifact** — it's a compressed memory document designed to be injected into an LLM context to restore working knowledge of two projects after a session reset. The experiment being conducted is:

1. How much information can be preserved in <13KB (Memento2)?
2. How accurately can an LLM reconstruct full understanding from compressed symbols?
3. What's the optimal compression format for LLM memory (symbols vs. narrative vs. structured data)?

**Inference about the broader research:**
- The author is testing whether Claude can serve as its own decompressor — i.e., whether pre-trained knowledge fills the gaps left by compression
- The 77% compression ratio with <5% critical info loss suggests the author found that ~23% of the original content was non-compressible critical information, and ~54% was reconstructible from context + inference
- The "Memento3" request (compress further to <5KB) is testing whether a second compression pass can find further redundancy, especially by offloading known patterns to Claude's pretrained knowledge

**The key insight the experiment seems to be exploring:** Claude's pretrained knowledge acts as a free compression dictionary. Information that Claude already "knows" (design patterns, Python ecosystem constraints, Firebase patterns, etc.) doesn't need to be spelled out — it only needs to be referenced.

---

*Reconstruction generated from Memento2.md via inference, pattern-matching, and domain knowledge. Stated facts preserved verbatim. Inferred content marked where uncertain.*
