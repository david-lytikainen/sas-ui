# SAS UI

React and TypeScript frontend for Saved & Single. This `bootstrap5` preview branch uses native HTML, Bootstrap 5, and Font Awesome. The existing authentication, event, schedule, timer, and profile flows still use SAS API.

## Preview locally

```bash
git switch bootstrap5
cd client
npm ci
npm start
```

Open http://localhost:3000. The default API is `http://localhost:5001/api`; set `REACT_APP_API_URL` in `client/.env` for another backend. The backend must allow the frontend origin through CORS.

## Build

```bash
cd client
npm run build
```

The output is `client/build`. Review this branch before merging it into your usual branch.

## Styling

Use Bootstrap utilities, `row`/`col-*`, forms, cards, and buttons directly in JSX. Font Awesome icons use native `i` tags. `client/src/styles/theme.css` holds the existing light/dark palette and the small set of rules for content widths, touch targets, and native dialogs. Profile → Dark Mode changes the theme immediately and persists it.

Birthday fields use the device's native date input. Dialogs use native `dialog` focus handling and Bootstrap styling; Escape and backdrop clicks close them, except the post-registration preferences backdrop remains disabled.
