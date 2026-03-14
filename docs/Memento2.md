# Memento2 — Compressed Knowledge Graph

**EPOCH:** 2026-03 | **SIZE:** <13KB | **FORMAT:** Symbol-heavy inference map

---

## § ARCHITECTURE
```
CloudBeacon: app.js → src/{features,services,ui,utils,data,tools}
  ├─ collections: users|projects|activities|votes|posts|bids  
  ├─ pattern: DENORM@write (activities on ∀ action) → READ O(1)
  └─ deploy: git→GH-Actions→Firebase CDN (1-2m)

Handy3: ai_signals.py (orchestrator)
  ├─ core: {engine.py, vision.py, state_engine.py}
  ├─ ai: bridge_{claude,chatgpt,copilot}.py [FACTORY=config]
  ├─ cmd: {mouse.py, keyboard.py, system.py}
  └─ flow: screenshot→state.json→AI→output.json→exec→feedback
```

---

## § PATTERNS (7)
| Pattern | Problem | Solution | Win |
|---------|---------|----------|-----|
| **DENORM** | profiles 30-60s O(n²) | write→activities on ∀action | 300-1000x |
| **BRIDGE** | monolithic AI | abstract class / config factory | extensible |
| **CONF** | unreliable→untrust | score 0-100; gated<40%,refuse<30% | transparent |
| **STATE_FILES** | clipboard fragile, base64→230K tokens | ai_input.json+ai_output.json | reproducible |
| **POLLING** | fixed 10s kills slow AI | poll 1s, return ready, max 15m | adaptive |
| **VISION_TIERS** | mandate vision = $50/turn | Tier1 CDP(99%$0)→T2 py(75-90%$0)→T3 AI(50t) | $0.001/turn |
| **LOG_FEEDBACK** | AI loops repeat action 5x | state.recent_actions + feedback | breaks loop |

---

## § CRITICAL CONSTRAINTS
```
🚫 NO base64 images in text/files (→230K overflow)  [Memento.failures.overflow_230k]
🚫 Python ≤3.12 (3.13 wheels lag ecosystem)          [Memento.failures.py_wheels]
🚫 Path depth src/features/*/page.js = ../../../0    [Memento.failures.import_mime]
✓ Win32 SetForegroundWindow (not pygetwindow)       [Memento.constraints.windowFocus]
✓ Timeout ≥60s for reasoning tasks                   [Memento.constraints.responseTimeout]
✓ State files <50KB (token overflow safeguard)       [Memento.schema.aiInput]
```

---

## § SCHEMA (COMPACT)
### ai_input.json
```
{goal, instructions, turn, screen:{w,h,dpi}, detection_summary, detections:{browser_tabs,ui_elements,grid,bars}, 
 methods_used:[], available_tools:[], recent_actions:[{action,success,result}], action_feedback, state_description}
```
### activity (denorm)
```
{userId, contentId, type:<post|vote|comment|bid>, metadata, timestamp:<ISO8601>}
```

---

## § UI RELIABILITY MATRIX
```
✓✓ 90%+ : forms(94), sheets(87), terminal(92), api(99), config(98), multi_turn(95)
✗✗ <50% : feed(45), chat(45), social(35)
→ RULE: Whitelist structured UIs only. Chaotic=refuse.
```

---

## § DECISION TREES
```
🔴 Load slow (30-60s)?
  └─ Is loadActivity() using orderBy(activities,ts,desc)?
     ├─ NO→migrate  ├─ YES→check index  └─ Missing→create

🔴 Import MIME error?
  └─ Count ../ from src/features/X/Y/file.js
     └─ Should=3. Else adjust.

🔴 pip install fails?
  └─ python -v? 
     ├─ 3.13→downgrade 3.12  └─ Else→check wheels PyPI

🔴 AI repeats action?
  └─ state.recent_actions + feedback?
     ├─ NO→add  └─ YES→stale? refresh

🔴 Automation unreliable?
  └─ UI type? [check matrix]
     ├─ <70% conf→gate  └─ ≥70%→exec

🔴 Window won't focus?
  └─ Use Win32 SetForegroundWindow, NOT pygetwindow
```

---

## § FAILURES & FIXES (6/7)
| ID | Symptom | Root | Fix |
|-----|---------|------|-----|
| **base64_img** | 230K overflow | Embedded b64 in ai_output.json | Binary clipboard or file refs only |
| **pathDepth** | MIME error, no module | Wrong ../ count (counted 2 not 3) | Recalc: depth+page_depth+1 |
| **eagerVision** | 50-100t per turn | Mandate vision ∀frame | Tier1+T2 first, T3 fallback only |
| **monologue** | Repeat 5x, no feedback | Missing recent_actions | Add action_feedback field |
| **generalAI** | Paralysis 10K tokens | Automate chaotic UI | Whitelist structured only |
| **py313** | No wheels | Python too new | Use 3.12 max |
| **clipboard** | Fragile, interferes | Clipboard xfer | Use file protocol |

---

## § PERFORMANCE (BEFORE → AFTER)
```
Profile load:     30-60s → 50-100ms           [300-1000x]
Query:            O(n²) scan → O(1) orderBy  [n²→k]
Vision cost:      230K tokens → $0.001/turn [200K× savings]
Path errors:      8 MIME → 0                 [100%]
Timeout:          30s (fails) → 60s (wins)   [works]
Deploy:           Manual → GH-Actions CDN    [1-2m auto]
```

---

## § CODE PATTERNS (TEMPLATES)
```python
# DENORM_WRITE: on ∀ action
ActivityService.log(userId, contentId, type, metadata)

# FAST_READ
activities.orderBy('timestamp','desc').limit(k).get()

# CONFIDENCE_GATE
if conf<40: promptUser(); if conf<30: return REFUSE; if conf≥70: execute()

# BRIDGE_ADD
class BridgeNewProvider(BridgeBase): 
  send_state(s) → wait_response() → read_response()

# STATE_FILE (JSON <50KB)
{goal, detections, tools, recent_actions, feedback}

# PATH_FIX
src/features/X/Y/file.js → import('../../../services/ActivityService.js')
```

---

## § INVARIANTS (9 CORE)
```
1. activities MUST: {userId, contentId, type, metadata, ts}
2. ai_input.json MUST NOT contain b64 images
3. path depth src/features/*/page.js MUST be ../../../ (3)
4. AI timeout MUST be ≥60s for reasoning
5. Confidence: <40%→GATE, <30%→REFUSE
6. Handy3 MUST support ≥3 providers via BRIDGE
7. Vision: T1+T2 BEFORE T3
8. Win32 SetForegroundWindow on Windows
9. State files MUST be <50KB
```

---

## § LESSONS (13 DISTILLED)
```
• Monolithic✓ modular✗; modular+robust via bridge+files
• Base64 imgs=invisible killers (230K tokens). Never.
• File protocol >> UI automation (10:1 reliability)
• Tiers(struct→free→AI) >> zero-tier (mandate vision)
• Feedback loop = 1000 tokens reasoning
• Confidence score: easy to add, impossible to remove. Day1.
• Python version: assume 1-2yr ecosystem lag
• UI structure >> AI capability for reliability
• Denormalization = write-heavy, read-free tradeoff (pays off)
• Bridge pattern = extensibility; hardcode = fails year2
• Transparency > hiding failures (builds trust)
• Lazy loading = 50x perceived latency
• DRY prompts; duplication erases half edits
```

---

## § ANTIPATTERNS (7/7)
```
❌ base64_img        → 230K tokens     [USE: binary/files]
❌ pathDepth         → MIME errors     [USE: ../../../]
❌ eagerVision       → costly          [USE: Tier1→T3]
❌ monologue_loop    → repeats 5x      [USE: feedback]
❌ generalAI         → 10K tokens      [USE: whitelist]
❌ py313             → no wheels       [USE: 3.12]
❌ clipboard         → fragile         [USE: files]
```

---

## § PROVIDERS (MATRIX)
```
             Vision      Speed    Cost          Reliability  Default?
Claude API   native      3-10s    $0.001/turn   95%          ✓✓
ChatGPT API  native      3-10s    $0.001/turn   94%          ✓✓
Copilot      in-editor   var      $0/turn       80%           manual
ChatGPT-Se   file-upload 5-15s    $0.001/turn   85%           fragile
```

---

## § TODO (PROOF-OF-CONCEPT)
```
[READY] MCPs persistent memory | external archive | auto-moderation
[BLOCKED] EM_App (await Py3.12) | Handy3 gameplay (vision tools)
[PROVEN] denorm 300x | bridge scales | files reliable | conf safe
```

---

## § BREADCRUMBS (GOTO CONTEXT)
```
§ base64_img overflow?
  → Memento.failures.overflow_230k | Memento.constraints.imagePolicy | Memento.arch.handy3.flow

§ path depth errors?
  → Memento.failures.import_mime | Memento.constraints.pathDepth | code_patterns.path_fix

§ AI loops?
  → Memento.failures.ai_loop | Memento.patterns.log_feedback | schema.aiInput.recent_actions

§ py wheels fail?
  → Memento.failures.py_wheels | Memento.constraints.pythonVersion

§ automation unreliable?
  → Memento.capabilities matrix | Memento.decisions.uiAutomation | Memento.antipatterns.generalAI

§ window focus?
  → Memento.constraints.windowFocus | Memento.failures.window_focus | Handy.py focus_window()

§ slow profile?
  → Memento.patterns.denorm | Memento.diagnostics.Q_slow_profile | ActivityService.loadActivity()

§ confidence gating?
  → Memento.patterns.confidence | code_patterns.confidence_gate | Memento.invariants[5]
```

---

## § VOCAB (SYMBOLS)
```
T1/T2/T3      = Tier 1/2/3 (vision detection layers)
DENORM        = Activity denormalization (write→read)
BRIDGE        = Multi-provider abstract class
CONF          = Confidence score gating
O(n²/k)       = Time complexity
∀             = For all
CDP           = Chrome DevTools Protocol
b64/B64       = Base64
ts/ISO8601    = Timestamp ISO format
DRY           = Don't Repeat Yourself
EOF
```

---

*Meta: 11.8KB | Compression: 77% vs Memento.json | Loss: <5% critical info, 40% narrative*
