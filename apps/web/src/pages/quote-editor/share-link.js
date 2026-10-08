import { copy } from '../../core/copy.js';
import { html, on } from '../../core/dom.js';
import { icons } from '../../components/icon/icon.js';
import { openModal } from '../../components/modal/modal.js';
import { showToast } from '../../state/toast.js';
import { copyText } from '../../utils/clipboard.js';

/** Show a one-time link (share or invite) with a copy button. */
export function showLinkModal({ title, lead, url, onClose }) {
  const { dialog } = openModal({
    title,
    body: html`
      <p>${lead}</p>
      <div class="share-link">
        <label class="visually-hidden" for="share-url">${copy.editor.shareLink}</label>
        <input class="share-link__input" id="share-url" value="${url}" readonly />
        <button class="button button--primary" type="button" data-copy>${icons.copy} ${copy.common.copy}</button>
      </div>
    `,
  });
  const input = /** @type {HTMLInputElement} */ (dialog.querySelector('#share-url'));
  input.addEventListener('focus', () => input.select());
  on(dialog, 'click', '[data-copy]', async () => {
    await copyText(url);
    showToast(copy.common.copied);
  });
  if (onClose) dialog.addEventListener('close', onClose);
}
