import { NAME_MAX } from '@folio/shared';
import { api } from '../../core/api.js';
import { copy } from '../../core/copy.js';
import { html } from '../../core/dom.js';
import { Field, TextareaField } from '../../components/field/field.js';
import { openModal } from '../../components/modal/modal.js';
import { showToast } from '../../state/toast.js';

/** Add (no customer) or edit a customer in a modal. Resolves via onSaved. */
export function openCustomerForm(customer, onSaved) {
  const c = copy.customers;
  openModal({
    title: customer ? c.edit : c.add,
    body: html`
      ${Field({ label: c.companyName, name: 'companyName', required: true, value: customer?.companyName, maxlength: NAME_MAX, autocomplete: 'organization' })}
      <div class="field-grid">
        ${Field({ label: c.contactName, name: 'contactName', value: customer?.contactName, optional: true, maxlength: NAME_MAX })}
        ${Field({ label: c.email, name: 'email', type: 'email', value: customer?.email, optional: true })}
      </div>
      ${Field({ label: c.phone, name: 'phone', type: 'tel', value: customer?.phone, optional: true, maxlength: 40 })}
      ${TextareaField({ label: c.address, name: 'address', value: customer?.address, optional: true, rows: 2, maxlength: 300 })}
    `,
    onSubmit: async (values) => {
      const { data } = customer ? await api.patch(`/customers/${customer.id}`, values) : await api.post('/customers', values);
      showToast(c.savedToast);
      onSaved(data);
    },
  });
}
