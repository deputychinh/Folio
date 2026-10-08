// /invite/:token — the invited person signs in (guard), then we accept.
import { ROUTES } from '@folio/shared';
import { api } from '../../core/api.js';
import { copy } from '../../core/copy.js';
import { createElement, html, render } from '../../core/dom.js';
import { navigate } from '../../core/router.js';
import { showToast } from '../../state/toast.js';
import { loadSession, selectWorkspace } from '../../state/session.js';

export async function InvitePage({ params }) {
  const el = createElement('section', 'auth-card');
  render(el, html`<h1 class="auth-card__title">${copy.invite.title}</h1><p class="auth-card__lead" data-status>${copy.invite.accepting}</p>`);

  try {
    const { data } = await api.post(`/invites/${encodeURIComponent(params.token)}/accept`);
    await loadSession();
    selectWorkspace(data.workspaceId);
    showToast(copy.invite.accepted);
    queueMicrotask(() => navigate(ROUTES.DASHBOARD, { replace: true }));
  } catch {
    render(
      el,
      html`
        <h1 class="auth-card__title">${copy.invite.title}</h1>
        <p class="form-message form-message--error">${copy.invite.failed}</p>
        <p class="auth-card__footer">${copy.invite.signInFirst}</p>
        <a class="button" href="${ROUTES.DASHBOARD}">${copy.notFound.home}</a>
      `,
    );
  }
  return { el, title: copy.invite.title };
}
