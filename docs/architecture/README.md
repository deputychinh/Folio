Architecture diagrams

Every diagram comes from `gen_diagrams.py`; edit that script, not the .drawio files. To regenerate the files and their PNGs, run `npm run diagrams`, which needs draw.io desktop (`brew install --cask drawio`).

- `architecture.drawio`: browsers, Vercel (static SPA + one NestJS function), Supabase (Auth, Postgres, Storage) and the delivery pipeline. The numbered arrows are explained in the table under the drawing.
- `backend_layers.drawio`: the path of one API request through middleware, guards, validation, controller, service, repository and Postgres.
- `frontend_spa.drawio`: how the vanilla JS app boots and how router, pages, components, api and auth fit together.
- `erd.drawio`: tables and keys.
- `quote_state.drawio`: quote statuses and the moves allowed between them.
- `business_flows.drawio`: seven sequence diagrams (B1–B7), one per business flow. Each one names the requirements it covers in `docs/plan.md`.
