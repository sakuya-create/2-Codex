# Project Agent Instructions

## Design System Reference

When deciding or implementing UI design for this project, always reference the installed `awesome-design-skills` materials before writing or changing frontend code.

Selected design skill: **Friendly**

Primary project-local references:
- `design-skills/friendly/SKILL.md`
- `design-skills/friendly/DESIGN.md`

Installed Codex skill reference:
- `/Users/a398/.codex/skills/friendly/SKILL.md`

Source repository reference:
- `/Users/a398/Documents/awesome-design-skills/skills/friendly/SKILL.md`
- `/Users/a398/Documents/awesome-design-skills/skills/friendly/DESIGN.md`

## Why Friendly Was Chosen

This project is a personal, daily 10-minute creativity game called "ひらめき工房". The desired UI is bright and playful while keeping writing areas calm and focused.

Compared candidates:
- `friendly`: Best fit. Approachable, rounded, pastel, playful, and readable. Supports game-like rewards without making text-entry screens noisy.
- `creative`: Good for expressive landing pages, but too loud for repeated daily writing sessions.
- `colorful`: Strong engagement and contrast, but risks overpowering calm input areas.
- `doodle`: Good for artistic warmth, but handwritten styling can reduce readability in a practical productivity game.
- `claymorphism`: Playful and tactile, but visually heavier and easier to overuse.
- `bento`: Good for dashboards and history screens, but less distinctive as the core emotional style.
- `application`: Good app structure, but too developer-dashboard oriented and purple-themed for this game.

## Implementation Rules

- Use `Friendly` as the default visual direction for all game UI.
- Keep reward, card, title, and achievement surfaces playful with soft pastel accents.
- Keep writing and idea-entry areas calmer: high-contrast text, clear labels, generous whitespace, and minimal decoration.
- Preserve WCAG 2.2 AA intent: visible focus states, keyboard-accessible controls, clear labels, and no low-contrast text.
- Prefer semantic design tokens in CSS such as `--color-primary`, `--color-secondary`, `--color-surface`, `--color-text`, `--radius-md`, and `--space-md`.
- Do not mix in another `awesome-design-skills` visual style unless the user explicitly asks to change the selected skill.
