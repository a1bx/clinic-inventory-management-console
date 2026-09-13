# Clinic stock console

This project is a TypeScript/React implementation of the Savannah Informatics web engineer assessment.

Deployed application: https://clinic-inventory-management-console.vercel.app/

## Design and decisions

The shell owns navigation, signed-in user identity, connection status and the clinic selector. The inventory page is divided into summary cards, URL-backed filters, a paginated results table/cards, and correction dialog. The item page is a dedicated shareable route with item facts, correction history and the same correction flow.

Authentication and server data live in `InventoryContext`; the short-lived DummyJSON session is stored in `sessionStorage`, while stock is fetched into context and refreshed after an update. Search, category, status, sort and page are URL state so reloads and copied links reproduce the same view. Dialog fields and transient save state are local UI state.

The API response is presented through a clinic inventory vocabulary: product stock and IDs remain the source of truth, while a deterministic presentation mapping supplies operational names, categories, units and storage locations. The original DummyJSON product title, category and supplier are retained internally for search and traceability. This makes the scenario readable as a clinic console without pretending DummyJSON contains clinical product data. The mock API does not persist PUT changes, so after a successful response the app stores the corrected quantity, last-counted metadata and correction history in `sessionStorage` and reapplies them after reload.

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

Use `emilys` / `emilyspass`, the credentials supplied by DummyJSON. Checks are `npm run format:check`, `npm run lint`, `npm test -- --run`, and `npm run build`.

To test the slow-search race condition locally, start with `VITE_API_DELAY=2000 npm run dev`, type one query, then immediately replace it with another. The earlier response is aborted and cannot overwrite the newer results. After signing in, adding `?error=500` to the list URL exercises the real DummyJSON `/http/500` error response and the retry state.

## CI/CD

GitHub Actions runs formatting, linting, commit-message validation, tests and build on pull requests. A failed check blocks the merge when branch protection is enabled. Merges to `main` deploy to Vercel using `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` repository secrets.

## AI reflection

AI was used for scaffolding, repetitive React markup, API type definitions, and this documentation draft. I directed the implementation and reviewed the behavior against the assessment outcomes. I did not delegate the design decisions or this reflection: the design choices above are my own and should be edited to reflect the actual time and tools used before submission.

No spec-driven framework was used; work was structured by implementing the four assessment sections in order and checking each required user outcome. One useful AI suggestion was aborting stale requests with `AbortController`; one risk I caught was that DummyJSON PUT responses are not durable, so this app documents that limitation instead of implying persistence. Decisions made without AI were the fallback mapping for generic product fields and retaining a failed correction's original count because they are domain/product judgments.
