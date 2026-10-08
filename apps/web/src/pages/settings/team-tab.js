import { enumValues, formatDate, INVITE_ROLES, isManager, WorkspaceRole } from '@folio/shared';
import { api } from '../../core/api.js';
import { copy } from '../../core/copy.js';
import { html, on } from '../../core/dom.js';
import { asyncView } from '../../components/async-view/async-view.js';
import { Badge } from '../../components/badge/badge.js';
import { Field, SelectField } from '../../components/field/field.js';
import { icons } from '../../components/icon/icon.js';
import { confirmDialog, openModal } from '../../components/modal/modal.js';
import { currentWorkspace, session } from '../../state/session.js';
import { showToast } from '../../state/toast.js';
import { showLinkModal } from '../quote-editor/share-link.js';

function Team({ members, invites }, canManage) {
  const s = copy.settings;
  const me = session.get().me?.id;
  return html`
    <section class="card">
      <header class="card__header">
        <h2 class="card__title">${s.team}</h2>
        ${canManage ? html`<button class="button button--primary button--small" type="button" data-action="invite">${icons.plus} ${s.invite}</button>` : ''}
      </header>
      <div class="table-scroll"><table class="table"><tbody>
        ${members.map(
          (member) => html`<tr class="table__row">
            <td class="table__cell">
              <span class="table__title">${member.fullName || member.email}</span> ${member.userId === me ? Badge(s.you, 'accent') : ''}
              <span class="table__sub">${member.email}</span>
            </td>
            <td class="table__cell">
              ${canManage && member.userId !== me
                ? html`<label class="visually-hidden" for="role-${member.userId}">${s.inviteRole}</label>
                    <select class="toolbar__select" id="role-${member.userId}" data-role="${member.userId}">
                      ${enumValues(WorkspaceRole).map((role) => html`<option value="${role}" ${role === member.role ? html`selected` : ''}>${copy.role[role]}</option>`)}
                    </select>`
                : copy.role[member.role]}
            </td>
            <td class="table__cell table__cell--number">
              ${canManage && member.userId !== me
                ? html`<button class="button button--ghost button--small button--danger" type="button" data-remove="${member.userId}" data-name="${member.fullName || member.email}">${s.remove}</button>`
                : ''}
            </td>
          </tr>`,
        )}
      </tbody></table></div>
    </section>

    ${canManage && invites.length
      ? html`<section class="card">
          <header class="card__header"><h2 class="card__title">${s.pending}</h2></header>
          <div class="table-scroll"><table class="table"><tbody>
            ${invites.map(
              (invite) => html`<tr class="table__row">
                <td class="table__cell"><span class="table__title">${invite.email}</span><span class="table__sub">${s.expires(formatDate(invite.expiresAt))}</span></td>
                <td class="table__cell">${copy.role[invite.role]}</td>
                <td class="table__cell table__cell--number"><button class="button button--ghost button--small" type="button" data-revoke="${invite.id}">${s.revoke}</button></td>
              </tr>`,
            )}
          </tbody></table></div>
        </section>`
      : ''}
  `;
}

export function mountTeamTab(container) {
  const canManage = isManager(currentWorkspace()?.role);
  const s = copy.settings;
  const view = asyncView(
    container,
    async () => {
      const [members, invites] = await Promise.all([
        api.get('/members').then((r) => r.data),
        canManage ? api.get('/members/invites').then((r) => r.data) : [],
      ]);
      return { members, invites };
    },
    (data) => html`<div class="stack stack--lg">${Team(data, canManage)}</div>`,
  );

  const act = (task, message) => async () => {
    try {
      await task();
      if (message) showToast(message);
    } catch (error) {
      showToast(error.message, 'error');
    }
    await view.reload();
  };

  const offs = [
    on(container, 'click', '[data-action="invite"]', () =>
      openModal({
        title: s.invite,
        submitLabel: s.invite,
        body: html`
          ${Field({ label: s.inviteEmail, name: 'email', type: 'email', required: true })}
          ${SelectField({ label: s.inviteRole, name: 'role', value: WorkspaceRole.MEMBER, options: INVITE_ROLES.map((role) => ({ value: role, label: copy.role[role] })) })}
        `,
        onSubmit: async (values) => {
          const { data } = await api.post('/members/invites', values);
          setTimeout(() => showLinkModal({ title: s.inviteCreated, lead: s.inviteLead, url: data.inviteUrl, onClose: () => void view.reload() }), 0);
        },
      }),
    ),
    on(container, 'change', '[data-role]', (_, select) =>
      act(() => api.patch(`/members/${select.dataset.role}`, { role: select.value }), s.roleChangedToast)(),
    ),
    on(container, 'click', '[data-remove]', async (_, button) => {
      const ok = await confirmDialog({ title: s.remove, text: s.removeConfirm(button.dataset.name), confirmLabel: s.remove });
      if (ok) await act(() => api.delete(`/members/${button.dataset.remove}`), s.removedToast)();
    }),
    on(container, 'click', '[data-revoke]', (_, button) => act(() => api.delete(`/members/invites/${button.dataset.revoke}`), s.revokedToast)()),
  ];

  return () => [view.destroy, ...offs].forEach((off) => off());
}
