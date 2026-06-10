# Chip Select

Chip Select is a responsive poker chip planning web app. It helps home-game hosts choose chip denominations and counts for both cash games and tournament sets.


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



## Notes

 Tournament recommendations are implemented as presets from the [PCF Poker Set Selection Tool](https://www.pokerchipforum.com/resources/poker-set-selection-tool.90/). Cash game recommendations are calculated live from the entered blinds, starting stack, players, rebuys, and available chips.