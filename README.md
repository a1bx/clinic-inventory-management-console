# Clinic stock console

This project is a TypeScript/React implementation of the Savannah Informatics web engineer assessment.

Deployed application: https://clinic-inventory-management-console.vercel.app/

Repository: https://github.com/a1bx/clinic-inventory-management-console

## Design and decisions

The shell owns navigation, signed-in user identity, connection status and the clinic selector. The inventory page is divided into summary cards, URL-backed filters, a paginated results table/cards, and correction dialog. The item page is a dedicated shareable route with item facts, correction history and the same correction flow.

Authentication and server data live in `InventoryContext`; the short-lived DummyJSON session is stored in `sessionStorage`, while stock is fetched into context and refreshed after an update. Search, category, status, sort and page are URL state so reloads and copied links reproduce the same view. Dialog fields and transient save state are local UI state.

The API response is presented through a clinic inventory vocabulary: product stock and IDs remain the source of truth, while a deterministic presentation mapping supplies operational names, categories, units and storage locations. DummyJSON’s unrelated retail metadata is not exposed in the clinic-facing model or search, preventing mismatched results such as a Samsung search returning medical supplies. Northgate exposes the full 194-item catalogue, while Riverside uses a deterministic subset and clinic-specific stock profile to demonstrate multi-clinic separation. The mock API does not persist PUT changes, so after a successful response the app stores the corrected quantity, last-counted metadata and correction history in `sessionStorage` and reapplies them after reload.

New stock items are added to the active browser session because DummyJSON does not provide a durable clinic-specific inventory store or a required create workflow. CSV export downloads the current filtered result set, including the clinical display fields.

Decision log:

1. **Client-side pagination after one catalogue fetch.** I rejected a request for every page because DummyJSON exposes the catalogue total and only 194 records; loading the complete small catalogue makes URL navigation instant on ward Wi-Fi and keeps filters consistent. The trade-off is less suitable scaling for a real multi-thousand-item catalogue.
2. **Refresh the access token once on a 401.** I rejected silently clearing the screen or forcing an immediate sign-in because expiry should not lose a colleague's place. A refresh failure signs out cleanly and the URL remains available for the user to return to.
3. **Keep the previous stock count when a correction fails.** I rejected optimistic display of an unconfirmed count because a failed correction must not make the console claim the physical count was saved. The dialog remains open and the error toast explains how to recover.
4. **URL state uses replace navigation.** I rejected adding every keystroke to browser history because Back should navigate between work contexts, not every character typed into search.

Layout uses the existing small token set: page background, card surfaces, hairline borders and semantic stock colours. Geist is used for UI text and Geist Mono for SKUs/counts. Responsive cards replace the wide table below the tablet breakpoint, with 44px controls, visible focus rings and labelled live status/error regions for keyboard and screen-reader use.

## Running locally

```sh
npm install
npm run dev
```

Use `Jeremiah` / `Jeremiah@demo1`. The app maps these presentation credentials to the valid DummyJSON demo account behind the scenes. To use another valid DummyJSON account, set `VITE_DEMO_USERNAME` and `VITE_DEMO_PASSWORD` in the Vercel project environment. Checks are `npm run format:check`, `npm run lint`, `npm test -- --run`, and `npm run build`.

Search runs against the already-loaded clinic inventory, which makes it work offline and prevents stale network responses from replacing a newer query. After signing in, adding `?error=500` to the list URL exercises the real DummyJSON `/http/500` error response and the retry state.

## CI/CD

GitHub Actions runs formatting, linting, commit-message validation, tests and build on every pull request. A failed check blocks the merge when GitHub branch protection requires the `checks` job. Merges to `main` deploy automatically to Vercel using `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` repository secrets. The `commit-msg` Husky hook runs commitlint locally as well.

## AI reflection

AI was used by section as follows:

- Section 1 — pressure-testing the component/state split and accessibility decisions after the initial design direction was chosen.
- Section 2 — scaffolding, repetitive React markup, API types, persistence logic, responsive UI work and test scaffolding. The implementation was reviewed against the required outcomes.
- Section 3 — reviewing the GitHub Actions, Husky and Vercel deployment configuration.
- Section 4 — editing and organizing this reflection; the process statements and time record must be verified by the author.

No spec-driven framework was used; work was structured by implementing the four assessment sections in order and checking each required user outcome. The tools used were the coding agent, TypeScript, React, Vite, Vitest, ESLint, Prettier, Husky, commitlint, GitHub Actions and Vercel. One useful AI suggestion was separating URL state from server and UI state. One subtle issue caught during review was that searching hidden DummyJSON source names made “Samsung” return unrelated clinical items; that field was removed from user-facing search. Decisions made without AI were the clinic stock presentation, the failed-correction behavior, and the multi-clinic availability model because they are product judgments.

Time spent: **12 hours**.
