#!/usr/bin/env python3
"""Validate the structural invariants of the Budget agent system."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

required = [
    "AGENTS.md",
    "agents/AGENT-CONTRACT.md",
    "agents/START-HERE.md",
    "agents/HANDOFF-CONTRACT.md",
    "agents/PRODUCT-ISSUE-CONTRACT.md",
    "agents/AUDIT-CONTRACT.md",
    "agents/README.md",
    "agents/product/PRODUCT-AGENT.md",
    "agents/features/FEATURE-FACTORY-CONTRACT.md",
    "agents/features/FEATURE-WORKER.md",
    "agents/features/FEATURE-ORCHESTRATOR.md",
    "agents/infrastructure/INFRA-FACTORY-CONTRACT.md",
    "agents/infrastructure/INFRA-WORKER.md",
    "agents/infrastructure/INFRA-ORCHESTRATOR.md",
    "agents/audits/README.md",
    "agents/handoffs/README.md",
    "docs/VISION.md",
    "docs/PRODUCT.md",
    "docs/UX.md",
    "docs/ARCHITECTURE.md",
    "docs/DATABASE.md",
    "docs/SYNC.md",
    "docs/PRIVACY.md",
    "docs/SECURITY.md",
    "docs/I18N.md",
    "docs/ACCESSIBILITY.md",
    "docs/PERFORMANCE.md",
    "docs/DECISIONS.md",
    "docs/DISCUSSIONS.md",
    "docs/FUTURE.md",
]

missing = [p for p in required if not (ROOT / p).is_file()]
if missing:
    raise SystemExit("Missing required files:\n" + "\n".join(missing))

contract = (ROOT / "agents/AGENT-CONTRACT.md").read_text(encoding="utf-8")
required_terms = [
    "Challenge obligatoire",
    "tous les agents",
    "ne doit pas exécuter mécaniquement",
    "Données financières",
    "Vérification",
]
missing_terms = [term for term in required_terms if term not in contract]
if missing_terms:
    raise SystemExit("Common contract is missing mandatory rules: " + ", ".join(missing_terms))

print(f"OK: {len(required)} required governance files present and mandatory challenge rules found.")
