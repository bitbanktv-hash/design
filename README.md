# design

Design workspace with the [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
skill installed for Claude Code.

## Installed skills

Installed with the official CLI (`npx ui-ux-pro-max-cli init --ai claude`), which
bundles the design skill family under `.claude/skills/`:

| Skill | Purpose |
|---|---|
| `ui-ux-pro-max` | Design intelligence: 79 searchable UI styles, 192 product palettes and reasoning profiles, 74 font pairings, 119 UX guidelines, 25 chart types, 22 tech stacks |
| `design` | Logo, corporate identity, banners, icons, social photos |
| `design-system` | Three-layer token architecture and component specs |
| `brand` | Brand voice, visual identity, messaging frameworks |
| `ui-styling` | shadcn/ui + Tailwind component and theming guidance |
| `slides` | Strategic HTML presentations with Chart.js |
| `banner-design` | Banner art direction for social, ads, web, and print |

The skills activate automatically for UI/UX requests — just ask for the work:

```
Build a landing page for my SaaS product
Create a dashboard for healthcare analytics
Design a portfolio website with dark mode
```

## Requirements

Python 3.x (standard library only — the scripts install nothing and make no
network calls).

## Design system generator

```bash
# ASCII output
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness" --design-system -p "Serenity Spa"

# Markdown output
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "fintech banking" --design-system -f markdown

# Persist to design-system/MASTER.md (+ optional page override)
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "SaaS dashboard" --design-system --persist -p "MyApp" --page "dashboard"
```

## Domain and stack search

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "glassmorphism" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "elegant serif" --domain typography
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "dashboard" --domain chart
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "error summary validation" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "form validation" --stack react
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "responsive layout" --stack html-tailwind
```

Add `--json` for full, untruncated output (human-readable output truncates long
fields at 300 characters).

## Maintenance

```bash
npx ui-ux-pro-max-cli init --ai claude   # reinstall / update in place
npx ui-ux-pro-max-cli uninstall          # remove
python3 .claude/skills/ui-ux-pro-max/scripts/validate_data.py   # verify data files
```

Upstream project is MIT licensed; see the
[skill repository](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).
