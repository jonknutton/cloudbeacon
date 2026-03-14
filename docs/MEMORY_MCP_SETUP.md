# Memory MCP Setup Guide

**Status:** ✅ Implemented  
**Date:** 2026-03-13  
**Format:** JSONL Knowledge Graph  
**Size:** 11.15 KB (28 entities, 14 relations)  

---

## What Was Done

### 1. **Installation Configuration** 
- Created `.vscode/mcp.json` with Memory MCP server configuration
- Uses NPX (no Docker required)
- Stores memory in `knowledge.jsonl` in workspace root

### 2. **Knowledge Graph Created**
- Converted `Memento.json` (20 KB) → `knowledge.jsonl` (11 KB)
- Extracted into semantic entities:
  - **28 entities**: Patterns, antipatterns, constraints, failures, projects, capabilities, metrics, tasks
  - **14 relations**: System connects to all major components
- Fully queryable via Memory MCP tools

### 3. **Conversion Mapping**
| Memento Content | MCP Entity Type | Count |
|-----------------|-----------------|-------|
| Patterns | `pattern` | 7 |
| Antipatterns | `antipattern` | 7 |
| Failures | `failure_mode` | 6 |
| Projects | `project` | 3 |
| Constraints | `constraint_set` | 1 |
| Capabilities | `capabilities` | 1 |
| Metrics | `metrics` | 1 |
| Status/Tasks | `status` | 1 |
| System Root | `system` | 1 |

---

## How It Works

### Memory Flow
```
Your message in VS Code
    ↓
Claude Copilot requests context
    ↓
Memory MCP searches knowledge.jsonl
    ↓
Relevant entities + relations returned
    ↓
Claude responds with full context
    ↓
(Optional) Claude stores new facts via create_entities/add_observations
    ↓
knowledge.jsonl updated
```

### Key Tools Available
You can tell Claude to use these Memory MCP tools:

```
search_nodes(query)        → Find entities matching a query
open_nodes(names)          → Retrieve specific entities by name
create_entities(...)       → Add new facts
add_observations(...)      → Update existing entities
create_relations(...)      → Link entities together
read_graph()               → Inspect entire knowledge graph
```

**Example:** If you ask Claude "What's the pattern for denormalization?", Claude will:
1. Call `search_nodes("denormalization")`
2. Get back the PATTERN_DENORM entity with all observations
3. Use that context to answer your question

---

## Automatic Memory Recall

Memory MCP is **automatically loaded** when you:
1. Open VS Code Copilot chat
2. Ask Claude anything in the `cloudbeacon` workspace
3. Claude automatically has access to the knowledge graph

**No manual steps needed** — it's all automatic via the MCP server.

---

## Updating the Knowledge Graph

### Add New Facts While Coding
Simply tell Claude:
```
Remember this: [fact about your project/code/decision]
```

Claude will automatically:
- Create entities for new concepts
- Link them to existing entities
- Store in knowledge.jsonl

### Manual Updates
Edit `knowledge.jsonl` directly (JSONL format):
```json
{"type": "entity", "name": "NEW_FACT", "entityType": "concept", "observations": ["observation1", "observation2"]}
{"type": "relation", "from": "CloudBeacon_Knowledge_System", "to": "NEW_FACT", "relationType": "tracks"}
```

### Regenerate from Memento
If Memento.json is updated, regenerate knowledge graph:
```bash
python convert_memento_to_mcp.py
```

---

## Testing

### Test 1: Query a Pattern
In VS Code Copilot, ask:
```
"Tell me about the DENORM pattern and how it improves performance"
```

Claude should retrieve observations from `PATTERN_DENORM` and cite them.

### Test 2: Query Failures
Ask:
```
"What causes the 230K token overflow issue?"
```

Claude should find `FAILURE_OVERFLOW_230K` and explain the root cause.

### Test 3: UI Reliability
Ask:
```
"How reliable is automation for chat UIs?"
```

Claude should query `UI_RELIABILITY_MATRIX` and report ~45% reliability.

---

## Architecture

### File Structure
```
cloudbeacon/
├── .vscode/
│   └── mcp.json                    ← MCP server config
├── knowledge.jsonl                 ← Knowledge graph (11 KB)
├── convert_memento_to_mcp.py       ← Conversion script
├── Memento.json                    ← Source of truth
├── Memento2.md                     ← Compressed variants
├── Memento3.txt                    ← Ultra-compressed
└── COMPRESSION_ANALYSIS.md         ← Analysis of compression experiment
```

### Memory Persistence
- **Where:** `knowledge.jsonl` in workspace root
- **Format:** JSONL (one JSON object per line)
- **Scope:** Local to workspace, survives session restarts
- **Sync:** Manual (push to Git if desired)

---

## Troubleshooting

### Memory MCP not loading?
1. Check `.vscode/mcp.json` exists
2. Reload VS Code (`Ctrl+R`)
3. Check Claude Copilot settings are enabled

### Can't find facts?
1. Run `convert_memento_to_mcp.py` again if Memento.json changed
2. Ask Claude to `search_nodes("keyword")` directly
3. Check knowledge.jsonl exists and is not empty

### Want to reset memory?
```bash
rm knowledge.jsonl
python convert_memento_to_mcp.py
```

---

## What This Enables

✅ **Automatic context recall** — No need to copy-paste facts  
✅ **Persistent memory** — Survives VS Code restarts  
✅ **Semantic search** — Find related facts across projects  
✅ **Graph traversal** — "Who relates to what" queries  
✅ **Live updates** — Add facts during coding, they stick  
✅ **Workspace isolation** — Each project has its own knowledge.jsonl  

---

## Next Steps

1. **Test it:** Ask Claude about patterns in VS Code Copilot
2. **Extend it:** Add new entities as you code
3. **Sync it:** Push knowledge.jsonl to Git for team sharing (optional)
4. **Iterate:** Run `convert_memento_to_mcp.py` weekly to refresh from Memento.json

---

## System Prompt (Optional)

Add this to VS Code settings for better memory utilization:

```
You have access to a knowledge graph via Memory MCP. 
When answering questions about cloudbeacon patterns, architecture, failures, or decisions:
1. Search the knowledge graph first
2. Reference specific entities when available
3. Add new observations to entities when you learn things
4. Keep facts atomic (one fact = one observation)
```

---

## References
- [Memory MCP Repo](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [VS Code MCP Setup](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
