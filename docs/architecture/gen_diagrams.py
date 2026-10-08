"""Generate every Folio diagram as draw.io files (and PNGs with --png).

Run:  python3 docs/architecture/gen_diagrams.py [--png]      (or: npm run diagrams)
Out:  docs/architecture/*.drawio and *.png — see docs/plan.md §11.

Same conventions as real-estate/docs/architecture:
- data at the top of each function, layout by explicit coordinates, no hand edits of the output;
- numbered arrows match the flow tables in README.md;
- sequence diagrams: one lifeline per participant, steps 1 → n, solid = call, dashed = reply,
  loop = internal step, `opt [condition]` frames for branches.
Colours come from the Folio palette (apps/web/src/styles/tokens.css).
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

OUT_DIR = Path(__file__).resolve().parent

# Folio palette (tokens.css)
INK, TEAL, TEAL_SOFT, OCHRE, OCHRE_SOFT = "#1B2733", "#1F4E5A", "#E3EEF0", "#B4561F", "#F6E7DC"
PAPER, STONE, MUTED, WHITE = "#FAF8F3", "#E4DFD4", "#5B6670", "#FFFFFF"
GREEN, RED, AMBER, BLUE = "#2F7D4F", "#B42318", "#8A5E00", "#2F5E9E"

FONT = "fontFamily=Helvetica;"
F = 20          # body text
SMALL = 15      # technical line under a title
TITLE = 24      # column titles

BOX = ("rounded=1;whiteSpace=wrap;html=1;arcSize=6;fillColor={fill};strokeColor={stroke};strokeWidth=1.5;"
       f"fontColor={INK};fontSize={F};spacing=8;verticalAlign=middle;" + FONT)
COLUMN = ("swimlane;horizontal=1;startSize=56;html=1;whiteSpace=wrap;collapsible=0;rounded=1;arcSize=2;"
          f"fillColor={{fill}};swimlaneFillColor={{fill}};strokeColor={STONE};fontSize={TITLE};fontStyle=1;"
          f"fontColor={INK};" + FONT)
EDGE = ("edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;html=1;endArrow=block;endFill=1;"
        f"strokeColor={INK};strokeWidth=1.5;fontSize={SMALL + 1};fontColor={INK};labelBackgroundColor={WHITE};" + FONT)
DASHED = EDGE + f"dashed=1;strokeColor={MUTED};"
NOTE = (f"text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;fontSize={SMALL};fontColor={MUTED};" + FONT)


def label(title: str, sub: str = "") -> str:
    text = f"<b>{escape(title)}</b>"
    if sub:
        text += f'<br><font style="font-size:{SMALL}px;color:{MUTED}">{sub}</font>'
    return text


class Diagram:
    def __init__(self, name: str, width: int, height: int):
        self.name, self.width, self.height = name, width, height
        self.cells: list[str] = []

    def vertex(self, cid: str, value: str, style: str, x: float, y: float, w: float, h: float) -> str:
        geo = f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>'
        self.cells.append(f'<mxCell id="{cid}" value={quoteattr(value)} style={quoteattr(style)} vertex="1" parent="1">{geo}</mxCell>')
        return cid

    def box(self, cid: str, title: str, sub: str, x: float, y: float, w: float, h: float,
            fill: str = WHITE, stroke: str = TEAL) -> str:
        return self.vertex(cid, label(title, sub), BOX.format(fill=fill, stroke=stroke), x, y, w, h)

    def edge(self, cid: str, source: str, target: str, text: str = "", style: str = EDGE,
             points: list[tuple[float, float]] | None = None, ports: str = "") -> None:
        pts = ""
        if points:
            pts = '<Array as="points">' + "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in points) + "</Array>"
        geo = f'<mxGeometry relative="1" as="geometry">{pts}</mxGeometry>'
        self.cells.append(f'<mxCell id="{cid}" value={quoteattr(escape(text))} style={quoteattr(style + ports)} edge="1" '
                          f'parent="1" source="{source}" target="{target}">{geo}</mxCell>')

    def free_edge(self, cid: str, x1: float, y1: float, x2: float, y2: float, text: str, style: str,
                  points: list[tuple[float, float]] | None = None) -> None:
        pts = ""
        if points:
            pts = '<Array as="points">' + "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in points) + "</Array>"
        geo = (f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1}" y="{y1}" as="sourcePoint"/>'
               f'<mxPoint x="{x2}" y="{y2}" as="targetPoint"/>{pts}</mxGeometry>')
        self.cells.append(f'<mxCell id="{cid}" value={quoteattr(text)} style={quoteattr(style)} edge="1" parent="1">{geo}</mxCell>')

    def page(self) -> str:
        return (f'<diagram id={quoteattr(self.name)} name={quoteattr(self.name)}>'
                '<mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" '
                f'arrows="1" fold="1" page="1" pageScale="1" pageWidth="{self.width}" pageHeight="{self.height}" '
                f'background="{WHITE}" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>'
                + "".join(self.cells) + "</root></mxGraphModel></diagram>")


def mxfile(pages: list[Diagram]) -> str:
    return '<mxfile host="gen_diagrams.py" type="device">' + "".join(p.page() for p in pages) + "</mxfile>\n"


# ───────────────────────── 1. System architecture ─────────────────────────

def architecture() -> Diagram:
    d = Diagram("Folio — system architecture", 2060, 1050)
    for cid, text, x, w, fill in [
        ("col-clients", "Clients", 20, 330, PAPER),
        ("col-vercel", "Vercel (sin1)", 390, 640, TEAL_SOFT),
        ("col-supabase", "Supabase (ap-southeast-1)", 1070, 560, OCHRE_SOFT),
        ("col-delivery", "Delivery", 1670, 370, PAPER),
    ]:
        d.vertex(cid, text, COLUMN.format(fill=fill), x, 20, w, 900)

    d.box("member", "Team member", "browser · vanilla JS SPA<br>auth-js session", 50, 140, 270, 120)
    d.box("client", "Client", "browser · no account<br>opens /q/:token", 50, 560, 270, 120, stroke=OCHRE)

    d.box("cdn", "Edge network + static files", "index.html, hashed JS/CSS, fonts<br>CSP · HSTS · SPA fallback", 430, 120, 560, 120)
    d.box("fn", "Serverless function api/index.js", "NestJS app, built once per instance<br>/api/v1/* · Node 22 · 1 GB · 10 s", 430, 380, 560, 130)
    d.box("fn-modules", "Modules", "me · workspaces · members · customers<br>catalog · quotes · public-quotes · dashboard", 430, 560, 560, 110, fill=PAPER, stroke=STONE)
    d.box("fn-layers", "Inside each request", "AuthGuard → WorkspaceGuard → DTO validation<br>controller → service → repository", 430, 710, 560, 110, fill=PAPER, stroke=STONE)

    d.box("auth", "Auth (GoTrue)", "email + password, magic link<br>JWT signed ES256 · JWKS", 1110, 120, 480, 120, stroke=OCHRE)
    d.box("pg", "Postgres 17", "RLS on every table · is_member()<br>atomic functions: save_quote, send_quote,<br>respond_public_quote, accept_invite …<br>quotes_view (effective status)", 1110, 380, 480, 190, stroke=OCHRE)
    d.box("storage", "Storage", "workspace logos (next step)", 1110, 640, 480, 90, fill=PAPER, stroke=STONE)

    d.box("gh", "GitHub repository", "monorepo: apps/web · apps/api<br>packages/shared · supabase/", 1700, 120, 310, 120, stroke=INK)
    d.box("ci", "GitHub Actions · CI", "lint (BEM) · typecheck · unit<br>integration on local Supabase<br>bundle gate · Playwright E2E", 1700, 330, 310, 150, stroke=INK)
    d.box("migrate", "GitHub Actions · Migrate", "supabase db push<br>staging on merge · prod on approval", 1700, 560, 310, 120, stroke=INK)

    # Numbers only on the arrows; the table below (and README) says what each one is.
    d.edge("e1", "member", "cdn", "1", ports="exitX=1;exitY=0.25;entryX=0;entryY=0.25;")
    d.edge("e2", "member", "auth", "2", points=[(185, 90), (1350, 90)], ports="exitX=0.5;exitY=0;entryX=0.5;entryY=0;")
    d.edge("e3", "member", "fn", "3", points=[(365, 230), (365, 410)], ports="exitX=1;exitY=0.75;entryX=0;entryY=0.25;")
    d.edge("e4", "fn", "auth", "4", ports="exitX=1;exitY=0.2;entryX=0;entryY=0.8;")
    d.edge("e5", "fn", "pg", "5", ports="exitX=1;exitY=0.55;entryX=0;entryY=0.45;")
    d.edge("e6", "client", "cdn", "6", points=[(400, 580), (400, 215)], ports="exitX=1;exitY=0.17;entryX=0;entryY=0.8;")
    d.edge("e7", "client", "fn", "7", points=[(382, 650), (382, 480)], ports="exitX=1;exitY=0.75;entryX=0;entryY=0.75;")
    d.edge("e8", "fn", "pg", "8", style=DASHED, ports="exitX=1;exitY=0.9;entryX=0;entryY=0.85;")
    d.edge("e9", "gh", "cdn", "9", style=DASHED, points=[(1855, 70), (710, 70)], ports="exitX=0.5;exitY=0;entryX=0.5;entryY=0;")
    d.edge("e10", "gh", "ci", "on every PR", style=DASHED)
    d.edge("e11", "migrate", "pg", "10", style=DASHED, ports="exitX=0;exitY=0.5;entryX=1;entryY=0.6;")

    flows_text = (
        "<b>1</b> GET the SPA (static, CDN) &nbsp; <b>2</b> sign in / refresh token (auth-js) &nbsp; "
        "<b>3</b> /api/v1/* with Bearer JWT + x-workspace-id &nbsp; <b>4</b> verify JWT via JWKS (cached) &nbsp; "
        "<b>5</b> PostgREST + RPC as the user, so RLS applies<br>"
        "<b>6</b> client opens /q/:token &nbsp; <b>7</b> /api/v1/public/quotes/:token (rate-limited) &nbsp; "
        "<b>8</b> service role, only 3 locked functions &nbsp; <b>9</b> Vercel Git: preview per PR, main → production &nbsp; "
        "<b>10</b> migrations via supabase db push"
    )
    d.vertex("flows", flows_text, NOTE.replace(f"fontColor={MUTED}", f"fontColor={INK}") + "fontSize=16;", 20, 935, 2020, 60)
    d.vertex("legend", "Solid = request path · dashed = privileged or delivery path. "
             "The browser talks to Supabase only for Auth; all data goes through the API.", NOTE, 20, 1000, 1500, 30)
    return d


# ───────────────────────── 2. Backend layers ─────────────────────────

def backend_layers() -> Diagram:
    d = Diagram("Folio — API request pipeline (NestJS)", 1560, 1180)
    steps = [
        ("req", "HTTP request", "Vercel → Express adapter (serverless.ts)", PAPER, STONE),
        ("mw", "Middleware", "request id · JSON body ≤ 200 KB · access log", WHITE, INK),
        ("guard", "Guards", "AuthGuard: Bearer JWT → claims (JWKS)<br>WorkspaceGuard: x-workspace-id → role · @Roles(...MANAGER_ROLES)", WHITE, TEAL),
        ("pipe", "ValidationPipe", "class SaveQuoteDto implements SaveQuoteInput<br>whitelist · forbidNonWhitelisted · transform", WHITE, TEAL),
        ("ctrl", "Controller", "HTTP only: params → service → result", WHITE, TEAL),
        ("svc", "Service (only where there are rules)", "calcQuoteTotals · canTransition · tokens<br>throws AppError(ErrorCode) only", WHITE, OCHRE),
        ("repo", "Repository", "supabase-js queries + row ↔ API mappers<br>multi-row writes = one Postgres function", WHITE, TEAL),
        ("sb", "SupabaseService", "forUser(jwt) → RLS applies · admin() → public routes only", WHITE, TEAL),
        ("db", "Postgres", "RLS · is_member() · save_quote() … · quotes_view", OCHRE_SOFT, OCHRE),
    ]
    y = 30
    for i, (cid, title, sub, fill, stroke) in enumerate(steps):
        d.box(cid, title, sub, 60, y, 820, 100, fill=fill, stroke=stroke)
        if i:
            d.edge(f"s{i}", steps[i - 1][0], cid)
        y += 125

    d.box("filter", "ErrorFilter", "AppError | HttpException | unknown<br>→ { error: { code, message, details, requestId } }<br>status from ERROR_STATUS (one map)", 960, 380, 540, 150, fill=PAPER, stroke=RED)
    d.box("intercept", "ResponseInterceptor", "result → { data }<br>Paged → { data, meta }", 960, 580, 540, 110, fill=PAPER, stroke=GREEN)
    d.box("shared", "packages/shared  (single source)", "enums.ts · constants.ts · interfaces.ts<br>money.ts (calcQuoteTotals) · quote-status.ts<br>format.ts — used by API and SPA", 960, 760, 540, 150, fill=TEAL_SOFT, stroke=TEAL)
    d.edge("f1", "guard", "filter", "throws", style=DASHED, ports="exitX=1;exitY=0.5;entryX=0;entryY=0.2;")
    d.edge("f2", "svc", "filter", "throws", style=DASHED, ports="exitX=1;exitY=0.3;entryX=0;entryY=0.8;")
    d.edge("f3", "ctrl", "intercept", "returns", style=DASHED, ports="exitX=1;exitY=0.5;entryX=0;entryY=0.5;")
    d.edge("f4", "svc", "shared", "imports", style=DASHED, ports="exitX=1;exitY=0.8;entryX=0;entryY=0.3;")
    d.edge("f5", "pipe", "shared", "implements", style=DASHED, points=[(920, 420), (920, 820)],
           ports="exitX=1;exitY=0.8;entryX=0;entryY=0.6;")
    return d


# ───────────────────────── 3. Frontend SPA ─────────────────────────

def frontend_spa() -> Diagram:
    d = Diagram("Folio — single-page app (vanilla JS)", 1720, 1000)
    d.box("main", "main.js", "styles (layer order first) · route table<br>toast region · auth events", 40, 40, 380, 110, fill=PAPER, stroke=INK)
    d.box("router", "core/router.js", "History API · :params · query<br>guards → layout → page", 40, 220, 380, 110)
    d.box("guards", "core/guards.js", "requireAuth · requireWorkspace<br>guestOnly · safe ?next=", 40, 400, 380, 100)
    d.box("layout", "Layouts", "AppShell (sidebar, workspace switcher)<br>AuthLayout · none for /q/:token", 520, 220, 420, 110)
    d.box("page", "Page = async fn → { el, title, destroy }", "dashboard · quotes · quote-editor · customers<br>catalog · settings · public-quote · auth pages", 520, 400, 420, 120, stroke=OCHRE)
    d.box("components", "Components (BEM block = folder)", "button · field · modal(dialog) · table · badge<br>quote-document · activity · toast · pagination …", 520, 590, 420, 120)
    d.box("dom", "core/dom.js", "html`` escapes every value<br>render() · append() · on() delegation", 1040, 590, 380, 110, stroke=RED)
    d.box("api", "core/api.js", "fetch /api/v1 · Bearer · x-workspace-id<br>{ data, meta } · ApiRequestError", 1040, 400, 380, 110)
    d.box("auth", "core/auth.js", "@supabase/auth-js only<br>session, refresh, sign-out", 1040, 220, 380, 110)
    d.box("state", "state/", "session · workspace (cached) · toast<br>createStore(): get / set / subscribe", 1040, 40, 380, 110)
    d.box("copy", "core/copy.js", "every UI string (English)", 520, 40, 420, 90, fill=PAPER, stroke=STONE)
    d.box("css", "styles/  @layer tokens, base, layout, components, pages", "tokens.css = only file with colours · Stylelint: BEM + no raw values", 40, 790, 900, 100, fill=TEAL_SOFT, stroke=TEAL)
    d.box("shared", "@folio/shared", "enums · constants · interfaces<br>calcQuoteTotals · canTransition · format", 1040, 790, 380, 100, fill=TEAL_SOFT, stroke=TEAL)

    for cid, s, t, text in [
        ("a1", "main", "router", "startRouter()"), ("a2", "router", "guards", "before render"),
        ("a3", "router", "layout", "mount once"), ("a4", "layout", "page", "outlet"),
        ("a5", "page", "components", "compose"), ("a6", "components", "dom", "html``"),
        ("a7", "page", "api", "load / save"), ("a8", "api", "auth", "getToken()"),
        ("a9", "guards", "state", "loadSession()"), ("a10", "page", "shared", "totals, rules"),
    ]:
        d.edge(cid, s, t, text)
    return d


# ───────────────────────── 4. ERD ─────────────────────────

TABLE = ("swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=34;horizontalStack=0;resizeParent=1;"
         f"collapsible=0;html=1;rounded=1;arcSize=4;fillColor={TEAL};fontColor={WHITE};strokeColor={TEAL};"
         f"swimlaneFillColor={WHITE};fontSize=17;" + FONT)


def table(d: Diagram, cid: str, name: str, columns: list[str], x: float, y: float, w: float = 330) -> str:
    body = "<br>".join(escape(c) for c in columns)
    h = 34 + 21 * len(columns) + 16
    d.vertex(cid, name, TABLE, x, y, w, h)
    d.vertex(f"{cid}-cols", body, f"text;html=1;align=left;verticalAlign=top;spacingLeft=10;spacingTop=6;fontSize=14;fontColor={INK};"
             "fontFamily=Courier New;", x, y + 34, w, h - 34)
    return cid


def erd() -> Diagram:
    d = Diagram("Folio — data model (Postgres)", 1860, 1100)
    table(d, "profiles", "profiles", ["PK id = auth.users.id", "email", "full_name"], 40, 40)
    table(d, "workspaces", "workspaces", ["PK id", "name", "currency  currency_code", "tax_percent  numeric(5,2)",
                                          "brand_accent  #hex", "quote_seq  int", "FK created_by"], 480, 40)
    table(d, "customers", "customers", ["PK id", "FK workspace_id", "company_name", "contact_name · email", "phone · address",
                                        "archived_at"], 940, 40, 400)
    table(d, "catalog", "catalog_items", ["PK id", "FK workspace_id", "name · description", "unit  catalog_unit",
                                          "unit_price_minor  bigint", "active"], 1420, 40, 400)
    table(d, "members", "workspace_members", ["PK,FK workspace_id", "PK,FK user_id", "role  workspace_role"], 40, 380)
    table(d, "invites", "invites", ["PK id", "FK workspace_id", "email", "role (not owner)", "status  invite_status",
                                    "token_hash  UNIQUE", "expires_at"], 480, 380)
    table(d, "quotes", "quotes", ["PK id", "FK workspace_id · FK customer_id", "number  UNIQUE per workspace", "status  quote_status",
                                  "currency · valid_until", "discount_type · discount_value", "tax_percent",
                                  "subtotal/discount/tax/total _minor", "share_token_hash  UNIQUE",
                                  "sent_at · viewed_at · responded_at", "client_name · decline_reason · notes"], 940, 380, 400)
    table(d, "items", "quote_items", ["PK id", "FK quote_id  ON DELETE CASCADE", "FK workspace_id", "position",
                                      "FK catalog_item_id  NULL", "name · unit · quantity", "unit_price_minor · line_total_minor"],
          1420, 380, 400)
    table(d, "events", "quote_events", ["PK id", "FK quote_id · FK workspace_id", "type  quote_event_type", "FK actor_id  NULL",
                                        "created_at"], 940, 740, 400)
    table(d, "rate", "rate_limit_hits", ["PK key, window_start", "count"], 40, 740)

    rel = EDGE + "endArrow=ERmany;startArrow=ERone;endFill=0;startFill=0;"
    for cid, src, dst, ports in [
        ("r1", "profiles", "members", "exitX=0.5;exitY=1;entryX=0.5;entryY=0;"),
        ("r2", "workspaces", "members", "exitX=0;exitY=0.85;entryX=1;entryY=0.3;"),
        ("r3", "workspaces", "invites", "exitX=0.5;exitY=1;entryX=0.5;entryY=0;"),
        ("r4", "workspaces", "customers", "exitX=1;exitY=0.3;entryX=0;entryY=0.3;"),
        ("r5", "customers", "quotes", "exitX=0.5;exitY=1;entryX=0.5;entryY=0;"),
        ("r6", "catalog", "items", "exitX=0.5;exitY=1;entryX=0.5;entryY=0;"),
        ("r7", "quotes", "items", "exitX=1;exitY=0.3;entryX=0;entryY=0.3;"),
        ("r8", "quotes", "events", "exitX=0.5;exitY=1;entryX=0.5;entryY=0;"),
    ]:
        d.edge(cid, src, dst, "", style=rel, ports=ports)
    d.vertex("note", "Every business table also has FK workspace_id → workspaces (not drawn, to keep the picture readable). "
             "Money is always an integer number of minor units. RLS on every table: rows are visible only to members of their "
             "workspace (is_member). quotes, quote_items, quote_events and workspace_members change only through Postgres "
             "functions. rate_limit_hits has no policy: service role only.", NOTE, 40, 1000, 1780, 70)
    return d


# ───────────────────────── 5. Quote state machine ─────────────────────────

def quote_states() -> Diagram:
    d = Diagram("Folio — quote status", 1500, 640)
    state = ("ellipse;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};strokeWidth=2;fontSize=20;fontStyle=1;"
             f"fontColor={INK};" + FONT)
    for cid, name, x, y, fill, stroke in [
        ("draft", "DRAFT<br><font style='font-size:14px'>editable</font>", 40, 230, PAPER, MUTED),
        ("sent", "SENT", 380, 230, "#E3EBF6", BLUE),
        ("viewed", "VIEWED", 720, 230, TEAL_SOFT, TEAL),
        ("accepted", "ACCEPTED", 1120, 60, "#E2F1E8", GREEN),
        ("declined", "DECLINED", 1120, 250, "#FBE4E1", RED),
        ("expired", "EXPIRED", 1120, 440, "#F8ECD0", AMBER),
    ]:
        d.vertex(cid, name, state.format(fill=fill, stroke=stroke), x, y, 220, 110)
    for cid, s, t, text, extra in [
        ("t1", "draft", "sent", "send (member)", ""),
        ("t2", "sent", "viewed", "first open of /q/:token", ""),
        ("t3", "viewed", "accepted", "client accepts", ""),
        ("t4", "viewed", "declined", "client declines", ""),
        ("t5", "viewed", "expired", "valid_until passed", ""),
        ("t6", "sent", "accepted", "accept without view", "exitX=0.5;exitY=0;entryX=0;entryY=0.5;"),
        ("t7", "sent", "expired", "valid_until passed", "exitX=0.5;exitY=1;entryX=0;entryY=0.5;"),
    ]:
        d.edge(cid, s, t, text, ports=extra)
    d.vertex("note", "Only DRAFT can be edited. ACCEPTED, DECLINED and EXPIRED are final. Sending an open quote again only "
             "replaces its link. Duplicate creates a new DRAFT from any status. Source of truth: "
             "packages/shared/src/quote-status.ts (QUOTE_TRANSITIONS), checked again in the Postgres functions.",
             NOTE, 40, 580, 1400, 50)
    return d


# ───────────────────────── 6. Business flows (sequences) ─────────────────────────

PX, TECH_PX, COL_W, LIFE_W, HEAD, GAP, FRAME_PAD = 19, 15, 290, 230, 90, 62, 26
LIFELINE = ("shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;"
            f"recursiveResize=0;outlineConnect=0;portConstraint=eastwest;size={HEAD};fillColor={WHITE};strokeColor={TEAL};"
            f"fontColor={INK};fontSize={PX};" + FONT)
CALL = (f"html=1;verticalAlign=bottom;endArrow=block;endFill=1;strokeColor={INK};strokeWidth=1.5;fontSize={PX - 3};"
        f"fontColor={INK};labelBackgroundColor={WHITE};" + FONT)
REPLY = CALL.replace("endArrow=block;endFill=1;", "endArrow=open;endFill=0;") + f"dashed=1;strokeColor={MUTED};"
SELF = CALL + "edgeStyle=orthogonalEdgeStyle;align=left;labelPosition=right;spacingLeft=40;entryX=0;"
FRAME = (f"shape=umlFrame;whiteSpace=wrap;html=1;width={{w}};height=28;fontSize={PX - 4};fontStyle=1;strokeColor={OCHRE};"
         f"fontColor={OCHRE};" + FONT)


def sequence(name: str, participants: list[tuple[str, str, str]], steps: list[tuple[str, str, str, str]],
             frames: tuple[tuple[str, int, int, str, str], ...] = ()) -> Diagram:
    left, top = 20, 20
    starts = {f[1] for f in frames}
    after = {f[2] + 1 for f in frames}
    ys, y = [], top + HEAD + 50
    for n in range(1, len(steps) + 1):
        if n > 1:
            y += GAP + (FRAME_PAD if n in starts or n in after else 0)
        ys.append(y)
    height = ys[-1] + 50
    width = left * 2 + COL_W * (len(participants) - 1) + LIFE_W + 220
    d = Diagram(name, width, height + 20)
    xs: dict[str, float] = {}
    for i, (pid, title, tech) in enumerate(participants):
        x = left + i * COL_W
        xs[pid] = x + LIFE_W / 2
        d.vertex(f"ll-{pid}", f'<b>{escape(title)}</b><br><font style="font-size:{TECH_PX}px;color:{MUTED}">{escape(tech)}</font>',
                 LIFELINE, x, top, LIFE_W, height - top)
    for n, (kind, src, dst, text) in enumerate(steps, 1):
        text_label = f"{n}. {escape(text)}"
        yy = ys[n - 1]
        if kind == "self":
            d.free_edge(f"m{n}", xs[src], yy, xs[src] + 1, yy + 16, text_label, SELF,
                        points=[(xs[src] + 36, yy), (xs[src] + 36, yy + 16)])
        else:
            d.free_edge(f"m{n}", xs[src], yy, xs[dst], yy, text_label, REPLY if kind == "reply" else CALL)
    for i, (title, first, last, lp, rp) in enumerate(frames):
        fy = ys[first - 1] - 56
        fh = ys[last - 1] - ys[first - 1] + 76
        fx = min(xs[lp], xs[rp]) - LIFE_W / 2 + 4
        fr = max(xs[lp], xs[rp]) + LIFE_W / 2 - 4
        d.vertex(f"frame{i}", escape(title), FRAME.format(w=min(int(fr - fx) - 10, 11 * len(title) + 30)), fx, fy, fr - fx, fh)
    return d


MEMBER = ("user", "Member", "browser")
OWNER = ("user", "Owner", "browser")
CLIENT = ("client", "Client", "browser, no account")
TEAMMATE = ("new", "Teammate", "browser")
SPA = ("spa", "SPA", "vanilla JS")
AUTH = ("auth", "Supabase Auth", "GoTrue · JWKS")
API = ("api", "API", "NestJS on Vercel")
DB = ("db", "Postgres", "RLS + functions")


def flows() -> list[Diagram]:
    return [
        sequence("B1 Sign up and onboarding (FR-01, FR-02)", [MEMBER, SPA, AUTH, API, DB], [
            ("call", "user", "spa", "name, email, password"),
            ("call", "spa", "auth", "signUp()"),
            ("reply", "auth", "spa", "session (access + refresh token)"),
            ("call", "spa", "api", "GET /me"),
            ("call", "api", "auth", "verify JWT (JWKS)"),
            ("call", "api", "db", "select memberships as the user"),
            ("reply", "api", "spa", "200 { workspaces: [] }"),
            ("reply", "spa", "user", "redirect /onboarding"),
            ("call", "user", "spa", "company, currency, tax"),
            ("call", "spa", "api", "POST /workspaces"),
            ("call", "api", "db", "rpc create_workspace()"),
            ("self", "db", "db", "workspace + OWNER, one transaction"),
            ("reply", "api", "spa", "201 workspace"),
            ("reply", "spa", "user", "Overview"),
        ], frames=(("opt [no workspace yet]", 8, 13, "user", "db"),)),
        sequence("B2 Authenticated request (NFR-02)", [MEMBER, SPA, AUTH, API, DB], [
            ("call", "user", "spa", "open /quotes"),
            ("call", "spa", "auth", "getSession() — refresh if expired"),
            ("reply", "auth", "spa", "access token"),
            ("call", "spa", "api", "GET /quotes  Bearer + x-workspace-id"),
            ("self", "api", "api", "AuthGuard: verify JWT"),
            ("call", "api", "db", "WorkspaceGuard: role of caller"),
            ("reply", "api", "spa", "403 FORBIDDEN"),
            ("call", "api", "db", "select quotes_view (RLS filters)"),
            ("reply", "db", "api", "rows of this workspace only"),
            ("reply", "api", "spa", "200 { data, meta }"),
            ("call", "spa", "auth", "signOut() → /login"),
        ], frames=(("opt [not a member]", 7, 7, "spa", "api"), ("opt [401 from API]", 11, 11, "spa", "auth"))),
        sequence("B3 Build and save a quote (FR-06, NFR-03)", [MEMBER, SPA, API, DB], [
            ("call", "user", "spa", "edit line items"),
            ("self", "spa", "spa", "calcQuoteTotals() → live preview"),
            ("self", "spa", "spa", "autosave after 1.5 s idle"),
            ("call", "spa", "api", "PUT /quotes/:id (no totals sent)"),
            ("self", "api", "api", "DTO + rules (dates, discount ≤ 100 %)"),
            ("self", "api", "api", "calcQuoteTotals() — same shared code"),
            ("call", "api", "db", "rpc save_quote(quote, items, totals)"),
            ("self", "db", "db", "DRAFT only · replace items · one transaction"),
            ("reply", "db", "api", "INVALID_TRANSITION"),
            ("reply", "api", "spa", "409"),
            ("reply", "api", "spa", "200 quote"),
            ("reply", "spa", "user", "All changes saved"),
        ], frames=(("opt [no longer a draft]", 9, 10, "spa", "db"),)),
        sequence("B4 Send a quote (FR-07)", [MEMBER, SPA, API, DB], [
            ("call", "user", "spa", "Send to client"),
            ("call", "spa", "api", "POST /quotes/:id/send"),
            ("self", "api", "api", "canTransition(DRAFT, SENT) · has items"),
            ("self", "api", "api", "token = 32 random bytes · hash = sha256"),
            ("call", "api", "db", "rpc send_quote(id, hash)"),
            ("self", "db", "db", "SENT · store hash only · event"),
            ("reply", "api", "spa", "200 { quote, shareUrl } — shown once"),
            ("reply", "spa", "user", "copy-link dialog"),
        ]),
        sequence("B5 Client opens and answers (FR-08, FR-09, FR-10)", [CLIENT, SPA, API, DB], [
            ("call", "client", "spa", "open /q/:token"),
            ("call", "spa", "api", "GET /public/quotes/:token"),
            ("call", "api", "db", "rpc rate_limit_hit(ip) — service role"),
            ("reply", "api", "spa", "429 + Retry-After"),
            ("call", "api", "db", "rpc get_public_quote(sha256(token))"),
            ("self", "db", "db", "first open → VIEWED · past date → EXPIRED"),
            ("reply", "api", "spa", "200 client view (no internal ids)"),
            ("call", "client", "spa", "name + accept checkbox"),
            ("call", "spa", "api", "POST /public/quotes/:token/respond"),
            ("call", "api", "db", "rpc respond_public_quote()"),
            ("reply", "db", "api", "QUOTE_EXPIRED | INVALID_TRANSITION"),
            ("reply", "api", "spa", "200 ACCEPTED"),
            ("reply", "spa", "client", "Accepted by … — thank you"),
        ], frames=(("opt [over 30 calls / minute]", 4, 4, "spa", "api"),
                   ("opt [expired or already answered]", 11, 11, "api", "db"))),
        sequence("B6 Invite a teammate (FR-03)", [OWNER, SPA, API, DB, TEAMMATE], [
            ("call", "user", "spa", "email + role (member / admin)"),
            ("call", "spa", "api", "POST /members/invites"),
            ("self", "api", "api", "@Roles(owner, admin) · not a member yet"),
            ("call", "api", "db", "insert invite (hash, 7 days) — RLS"),
            ("reply", "api", "spa", "201 inviteUrl — shown once"),
            ("reply", "spa", "user", "copy link"),
            ("call", "new", "spa", "open /invite/:token, sign in"),
            ("call", "spa", "api", "POST /invites/:token/accept"),
            ("call", "api", "db", "rpc accept_invite(hash)"),
            ("self", "db", "db", "pending · not expired · same email"),
            ("reply", "api", "spa", "200 { workspaceId }"),
            ("reply", "spa", "new", "Overview of the new workspace"),
        ]),
        sequence("B7 Dashboard (FR-11)", [MEMBER, SPA, API, DB], [
            ("call", "user", "spa", "open Overview"),
            ("call", "spa", "api", "GET /dashboard"),
            ("call", "api", "db", "rpc dashboard_summary(ws, 30) — as user"),
            ("call", "api", "db", "expiring in 7 days (quotes_view)"),
            ("call", "api", "db", "latest quote_events"),
            ("reply", "db", "api", "this workspace only (RLS)"),
            ("self", "api", "api", "win rate = won ÷ decided"),
            ("reply", "api", "spa", "200 DashboardSummary"),
            ("reply", "spa", "user", "KPI cards + activity"),
        ]),
    ]


# ───────────────────────── Output ─────────────────────────

FILES: list[tuple[str, list[Diagram], list[str]]] = []


def build() -> None:
    FILES.extend([
        ("architecture.drawio", [architecture()], ["architecture.png"]),
        ("backend_layers.drawio", [backend_layers()], ["backend_layers.png"]),
        ("frontend_spa.drawio", [frontend_spa()], ["frontend_spa.png"]),
        ("erd.drawio", [erd()], ["erd.png"]),
        ("quote_state.drawio", [quote_states()], ["quote_state.png"]),
        ("business_flows.drawio", flows(), [
            "flow_b1_signup_onboarding.png", "flow_b2_authenticated_request.png", "flow_b3_save_quote.png",
            "flow_b4_send_quote.png", "flow_b5_client_answers.png", "flow_b6_invite_teammate.png", "flow_b7_dashboard.png",
        ]),
    ])
    for name, pages, pngs in FILES:
        assert len(pages) == len(pngs), name
        (OUT_DIR / name).write_text(mxfile(pages), encoding="utf-8")
        print("wrote", name, f"({len(pages)} page{'s' if len(pages) > 1 else ''})")


def export_png() -> None:
    """Export every page with draw.io desktop (brew install --cask drawio)."""
    for name, _, pngs in FILES:
        for index, png in enumerate(pngs, 1):
            subprocess.run(["drawio", "--export", "--format", "png", "--scale", "2", "--border", "20",
                            "--page-index", str(index), "-o", str(OUT_DIR / png), str(OUT_DIR / name)],
                           check=True, capture_output=True)
            print("exported", png)


if __name__ == "__main__":
    build()
    if "--png" in sys.argv:
        export_png()
