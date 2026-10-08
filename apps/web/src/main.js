// Boot: styles, route table, toast region, auth wiring, first render.
import './styles/load.js';
import './styles/load-components.js';

import { ROUTES } from '@folio/shared';
import { apiConfig } from './core/api.js';
import { auth } from './core/auth.js';
import { guestOnly, requireAuth, requireWorkspace } from './core/guards.js';
import { navigate, startRouter } from './core/router.js';
import { AppShell } from './components/app-shell/app-shell.js';
import { AuthLayout } from './components/auth-layout/auth-layout.js';
import { mountToasts } from './components/toast/toast.js';
import { CatalogPage } from './pages/catalog/catalog.js';
import { CustomerDetailPage } from './pages/customer-detail/customer-detail.js';
import { CustomersPage } from './pages/customers/customers.js';
import { DashboardPage } from './pages/dashboard/dashboard.js';
import { InvitePage } from './pages/invite/invite.js';
import { LoginPage } from './pages/login/login.js';
import { NotFoundPage } from './pages/not-found/not-found.js';
import { OnboardingPage } from './pages/onboarding/onboarding.js';
import { PublicQuotePage } from './pages/public-quote/public-quote.js';
import { QuoteEditorPage } from './pages/quote-editor/quote-editor.js';
import { QuotesPage } from './pages/quotes/quotes.js';
import { ResetPage } from './pages/reset/reset.js';
import { SettingsPage } from './pages/settings/settings.js';
import { SignupPage } from './pages/signup/signup.js';
import { clearSession } from './state/session.js';

const app = { layout: AppShell, guards: [requireWorkspace] };
const guest = { layout: AuthLayout, guards: [guestOnly] };

const routes = [
  { pattern: ROUTES.LOGIN, page: LoginPage, ...guest },
  { pattern: ROUTES.SIGNUP, page: SignupPage, ...guest },
  { pattern: ROUTES.RESET, page: ResetPage, layout: AuthLayout },
  { pattern: ROUTES.ONBOARDING, page: OnboardingPage, layout: AuthLayout, guards: [requireAuth] },
  { pattern: ROUTES.INVITE, page: InvitePage, layout: AuthLayout, guards: [requireAuth] },
  { pattern: ROUTES.PUBLIC_QUOTE, page: PublicQuotePage },
  { pattern: ROUTES.DASHBOARD, page: DashboardPage, ...app },
  { pattern: ROUTES.QUOTES, page: QuotesPage, ...app },
  { pattern: ROUTES.QUOTE_NEW, page: QuoteEditorPage, ...app },
  { pattern: ROUTES.QUOTE, page: QuoteEditorPage, ...app },
  { pattern: ROUTES.CUSTOMERS, page: CustomersPage, ...app },
  { pattern: ROUTES.CUSTOMER, page: CustomerDetailPage, ...app },
  { pattern: ROUTES.CATALOG, page: CatalogPage, ...app },
  { pattern: ROUTES.SETTINGS, page: SettingsPage, ...app },
];

function signedOut() {
  clearSession();
  if (!window.location.pathname.startsWith('/q/')) navigate(ROUTES.LOGIN, { replace: true });
}

apiConfig.onUnauthorized(async () => {
  await auth.signOut();
  signedOut();
});
auth.onChange((event) => {
  if (event === 'SIGNED_OUT') signedOut();
  if (event === 'PASSWORD_RECOVERY') navigate(`${ROUTES.RESET}?mode=update`, { replace: true });
});

mountToasts(document.body);
startRouter(document.getElementById('app'), routes, { pattern: '*', page: NotFoundPage });
