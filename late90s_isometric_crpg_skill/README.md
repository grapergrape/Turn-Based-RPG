# Late-90s Isometric Post-Apocalyptic CRPG Skill

This is a portable agent skill package for designing, art-directing, writing, and reviewing an original late-1990s isometric post-apocalyptic CRPG aesthetic.

It is formatted like a Claude-style Skill because that format is simple and useful:

- `SKILL.md` is the entrypoint.
- `references/` contains deeper production rules.
- `checklists/` contains review gates.
- `prompts/` contains reusable art/writing prompts.
- `schemas/` contains lightweight JSON specs for asset planning.
- `scripts/` contains optional local validation utilities.

The skill is intentionally IP-safe: it studies the era, camera language, visual density, animation constraints, UI weight, and writing structure of late-1990s CRPGs without copying exact copyrighted assets, locations, UI, icons, characters, dialogue, or faction designs.

## Suggested install locations

### Claude Code-style project skill

Place this folder in:

```text
.your-project-root/.claude/skills/late90s-isometric-crpg/
```

### General agent usage

Any agent or developer can read `SKILL.md` first, then load the referenced files as needed.

### Human production use

Treat `SKILL.md` as the art director's rulebook and the `checklists/` folder as review gates.

## Recommended first task

Ask your agent:

```text
Use the late90s-isometric-crpg skill to review my current screenshot and produce an art-direction punch list.
```

Then provide a screenshot of the current game.
