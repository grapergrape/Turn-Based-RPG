# `data/` Content Guide

This folder stores game content in JSON.

Use data files for content that designers, writers, or AI assistants may need to edit without touching engine code.

## Current folders

```text
data/
├── maps/
├── actors/
└── enemies/
```

## ID rules

- Every content file should have an `id`.
- IDs use lowercase kebab-case.
- File names should usually match IDs.
- Example: `host-penitent-bastion.json` contains `"id": "host-penitent-bastion"`.

## Validation

Run:

```bash
npm run check
```

This parses JSON and checks basic required fields.
