#!/usr/bin/env python3
"""Convert Memento.json to Memory MCP format (JSONL)"""

import json
import sys
from pathlib import Path

def convert_memento_to_mcp(memento_path, output_path):
    """Convert Memento.json to Memory MCP JSONL format"""
    
    with open(memento_path) as f:
        memento = json.load(f)
    
    entities = []
    relations = []
    
    # Root entity
    entities.append({
        "name": "CloudBeacon_Knowledge_System",
        "entityType": "system",
        "observations": [
            "Knowledge base synthesized 2026-03-13",
            "Created from 7 days of development (2026-03-01 to 2026-03-12)",
            "Three compression experiments: Memento→Memento2→Memento3",
            "Semantic content preserved across 84% size reduction",
            "Includes: patterns, antipatterns, constraints, failures, architecture"
        ]
    })
    
    # PATTERNS as entities
    for pattern_key, pattern_data in memento.get("patterns", {}).items():
        entity_name = f"PATTERN_{pattern_key.upper()}"
        entities.append({
            "name": entity_name,
            "entityType": "pattern",
            "observations": [
                f"Problem: {pattern_data.get('problem', '')}",
                f"Solution: {pattern_data.get('solution', '')}",
                f"Result: {pattern_data.get('result', pattern_data.get('benefit', ''))}",
                f"Apply to: {', '.join(pattern_data.get('apply', []))}" if pattern_data.get('apply') else None
            ]
        })
        entities[-1]["observations"] = [o for o in entities[-1]["observations"] if o]
        
        # Relation: pattern is part of system
        relations.append({
            "from": "CloudBeacon_Knowledge_System",
            "to": entity_name,
            "relationType": "contains_pattern"
        })
    
    # ANTIPATTERNS as entities
    for ap in memento.get("antipatterns", []):
        entity_name = f"ANTIPATTERN_{ap.get('id', '').upper()}"
        entities.append({
            "name": entity_name,
            "entityType": "antipattern",
            "observations": [
                f"Description: {ap.get('desc', '')}",
                f"Symptom: {ap.get('symptom', '')}",
                f"Root cause: {ap.get('root', '')}",
                f"Fix: {ap.get('fix', '')}"
            ]
        })
        entities[-1]["observations"] = [o for o in entities[-1]["observations"] if o]
    
    # CONSTRAINTS as entity
    entities.append({
        "name": "CONSTRAINTS",
        "entityType": "constraint_set",
        "observations": [
            f"{k}: {v}" for k, v in memento.get("constraints", {}).items()
        ]
    })
    relations.append({
        "from": "CloudBeacon_Knowledge_System",
        "to": "CONSTRAINTS",
        "relationType": "defines"
    })
    
    # FAILURES as entities
    for fail_key, fail_data in memento.get("failures", {}).items():
        entity_name = f"FAILURE_{fail_key.upper()}"
        entities.append({
            "name": entity_name,
            "entityType": "failure_mode",
            "observations": [
                f"Symptom: {fail_data.get('symptom', '')}",
                f"Root cause: {fail_data.get('root', '')}",
                f"Severity: {fail_data.get('severity', 'UNKNOWN')}",
                f"Fix: {fail_data.get('fix', '')}"
            ]
        })
        entities[-1]["observations"] = [o for o in entities[-1]["observations"] if o]
    
    # ARCHITECTURE components
    for project in ["CloudBeacon", "Handy3", "EM"]:
        entities.append({
            "name": f"PROJECT_{project}",
            "entityType": "project",
            "observations": [
                str(val) for val in memento.get("arch", {}).get(project.lower(), {}).values()
                if isinstance(val, str)
            ][:5]  # Limit observations
        })
        relations.append({
            "from": "CloudBeacon_Knowledge_System",
            "to": f"PROJECT_{project}",
            "relationType": "documents"
        })
    
    # CAPABILITIES matrix
    entities.append({
        "name": "UI_RELIABILITY_MATRIX",
        "entityType": "capabilities",
        "observations": [
            f"{ui}: {rating}" for ui, rating in memento.get("capabilities", {}).items()
        ]
    })
    relations.append({
        "from": "CloudBeacon_Knowledge_System",
        "to": "UI_RELIABILITY_MATRIX",
        "relationType": "tracks"
    })
    
    # KEY PRINCIPLES
    principles_obs = [f"{k}: {v}" for k, v in memento.get("principles", {}).items()]
    if principles_obs:
        entities.append({
            "name": "DESIGN_PRINCIPLES",
            "entityType": "principles",
            "observations": principles_obs
        })
        relations.append({
            "from": "CloudBeacon_Knowledge_System",
            "to": "DESIGN_PRINCIPLES",
            "relationType": "founded_on"
        })
    
    # PERFORMANCE METRICS
    entities.append({
        "name": "PERFORMANCE_GAINS",
        "entityType": "metrics",
        "observations": [
            f"{k}: {v}" for k, v in memento.get("performance_gains", {}).items()
        ]
    })
    relations.append({
        "from": "CloudBeacon_Knowledge_System",
        "to": "PERFORMANCE_GAINS",
        "relationType": "demonstrates"
    })
    
    # TODOS/Status
    tasks_obs = []
    for status, items in memento.get("todo", {}).items():
        for item in items:
            tasks_obs.append(f"[{status.upper()}] {item}")
    
    if tasks_obs:
        entities.append({
            "name": "TASK_STATUS",
            "entityType": "status",
            "observations": tasks_obs
        })
        relations.append({
            "from": "CloudBeacon_Knowledge_System",
            "to": "TASK_STATUS",
            "relationType": "tracks"
        })
    
    # Write JSONL
    with open(output_path, 'w') as f:
        for entity in entities:
            f.write(json.dumps({"type": "entity", **entity}) + '\n')
        for relation in relations:
            f.write(json.dumps({"type": "relation", **relation}) + '\n')
    
    print(f"✓ Converted {len(entities)} entities and {len(relations)} relations")
    print(f"✓ Wrote to {output_path}")
    return len(entities), len(relations)

if __name__ == "__main__":
    memento_in = Path("Memento.json")
    knowledge_out = Path("knowledge.jsonl")
    
    if not memento_in.exists():
        print(f"Error: {memento_in} not found")
        sys.exit(1)
    
    try:
        entities, relations = convert_memento_to_mcp(memento_in, knowledge_out)
        print(f"\n📊 Summary: {entities} entities, {relations} relations in knowledge graph")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
