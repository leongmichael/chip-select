# Chip Select

Chip Select is a responsive poker chip planning web app. It helps home-game hosts choose chip denominations and counts for both cash games and tournament sets.

## Features

- Cash game planner with live-updating chip value recommendations
- Starting stack input by money or big blinds
- Player count and estimated rebuys per player
- Editable chip set with custom colors, names, and quantities
- Tournament preset selector based on the PCF Poker Set Selection Tool PDF
- T25, T100, and T5 tournament recommendations
- Starter blind structure previews
- Light and dark themes
- Desktop and mobile responsive layout

## Getting Started

Install dependencies:

```bash
npm install
```

Run the local dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Tech Stack

- React
- TypeScript
- Vite
- Plain CSS

## Notes

Tournament recommendations are implemented as presets from the PCF Poker Set Selection Tool. Cash game recommendations are calculated live from the entered blinds, starting stack, players, rebuys, and available chips.
