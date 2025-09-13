
# Dragon Quest (No-Firebase Starter)

A Next.js 14 app with a multi-page quest flow:

1. `/` - Enter the Dungeon
2. `/register` - Name + Selfie (auto face crop in-browser)
3. `/rps` - Rock-Paper-Scissors (win 3 in a row)
4. `/dino` - Chrome Dino-lite (score 500)
5. `/memory` - Flip & Match (4x4)
6. `/battle` - Boss fight (PP, basic moves)
7. `/done` - Shows your time
8. `/board` - Local leaderboard (stored in localStorage)

## Run locally

```bash
npm i
npm run dev
# open http://localhost:3000
```

## Deploy (Vercel)

- Import the repo into Vercel (framework: Next.js, defaults OK).

## Notes

- Face detection uses MediaPipe Tasks Vision via CDN and runs entirely in the browser.
- Leaderboard is local-only in this starter (localStorage). You can wire Firebase later.
- A simple dragon SVG lives at `/public/dragon.svg`.
