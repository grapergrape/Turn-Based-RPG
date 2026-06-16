#!/usr/bin/env python3
"""Validate the expected structure of the late90s-isometric-crpg skill package."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    "SKILL.md",
    "README.md",
    "references/style_targets.md",
    "references/technical_rendering.md",
    "references/character_animation.md",
    "references/writing_and_quest_design.md",
    "references/ip_safety.md",
    "references/source_bibliography.md",
    "checklists/screenshot_review.md",
    "checklists/asset_definition_of_done.md",
    "checklists/animation_qc.md",
    "prompts/art_direction_goal_prompt.md",
    "prompts/character_sprite_prompt.md",
    "prompts/tileset_prompt.md",
    "prompts/ui_prompt.md",
    "prompts/quest_design_prompt.md",
    "schemas/character_sprite_spec.json",
    "schemas/tile_prop_spec.json",
    "schemas/npc_dialogue_schema.json",
]

missing = [path for path in REQUIRED if not (ROOT / path).exists()]
if missing:
    print("Missing required files:")
    for path in missing:
        print(f"- {path}")
    sys.exit(1)

skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")
if not skill.startswith("---"):
    print("SKILL.md must start with YAML frontmatter.")
    sys.exit(1)

for needle in ["name:", "description:", "Non-negotiable style laws", "Definition of success"]:
    if needle not in skill:
        print(f"SKILL.md missing expected section or metadata: {needle}")
        sys.exit(1)

print("Skill structure OK")
