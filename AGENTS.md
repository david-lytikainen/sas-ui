# SAS UI Contributor Guidance

## Project and workflow

- This repository is the React and TypeScript web UI for Saved & Single. Preserve the existing API contract and user flows unless a task explicitly changes them.
- Before implementation, read `../CONTEXT`, `../0_QUESTIONS`, and `../1_AGENT_TODOS`. The product owner wants to be heavily involved in design decisions. If a UX behavior or visual treatment is unclear, add a bulleted question under `UNANSWERED` at the top of `../0_QUESTIONS`, followed by a blank tab-indented line, rather than silently choosing a product direction.
- Preserve the user's wording in `AGENT_TODOS` and `0_QUESTIONS`. Follow the parent tracker workflow when completing an item.
- Keep changes focused and prefer a net reduction in code where practical.

## Stack and code style

- This branch uses React, TypeScript, native HTML, Bootstrap 5, and Font Awesome. Do not introduce MUI or another component framework unless explicitly requested.
- Prioritize mobile layouts and touch interaction. Use Bootstrap responsive utilities such as `col-12` and `col-md-*`, Bootstrap spacing, form controls, cards, and buttons before adding custom CSS.
- Keep custom CSS limited to design rules that Bootstrap cannot express or that already define shared theme behavior. Use native elements such as `div`, `details`, `summary`, and `i`; keep markup compact and place text-containing HTML elements on one line where practical.
- Keep imports on one line where practical. Preserve the repository's compact JSX style; if `sx` is used, normally keep it on one line.
- Keep interactive targets usable on touch screens; avoid movement or hover-only feedback on mobile. Preserve labels, keyboard behavior, visible focus, and sufficient contrast.
- Date pickers should guide users through year, month, then day selection. Follow the existing UI patterns unless a design question is needed.
- dont ever write any "aria" things on the UI

## Product and API behavior

- Ask before changing payment, registration, waitlist, walk-in, scheduling, matching, or organizer permissions behavior when the task does not specify the intended result.
- A walk-in attendee must refresh the event list, start the standard Stripe Checkout flow, and only appear as an attendee after successful payment confirmation. Do not present organizer authorization itself as a completed registration.
- Keep the UI aligned with current backend capabilities. Add any required API or database work to the SAS trackers and ask about unclear product scope.

## Delivery

- After UI changes, run `npm run build` from `client/` and report build failures or warnings that could affect delivery.
- If a change needs a migration, environment variable, or manual deployment action, record it in the appropriate SAS tracker as directed by the parent workflow.
- Commit and push changes to this repository when the user requests the project workflow to be completed.
