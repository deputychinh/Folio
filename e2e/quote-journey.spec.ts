// The main journey from docs/plan.md §7.9: sign up → onboard → customer →
// quote → send → the client accepts → the dashboard shows the win.
import { expect, test } from '@playwright/test';

test('a new studio sends its first quote and the client accepts it', async ({ page, browser }) => {
  const email = `e2e-${Date.now()}@folio.test`;

  await test.step('sign up and create a workspace', async () => {
    await page.goto('/signup');
    await page.getByLabel('Full name').fill('Erin Example');
    await page.getByLabel('Work email').fill(email);
    await page.getByLabel('Password').fill('Example@123');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByRole('heading', { name: 'Set up your workspace' })).toBeVisible();
    await page.getByLabel('Company name').fill('Example Studio');
    await page.getByLabel('Default tax rate (%)').fill('10');
    await page.getByRole('button', { name: 'Create workspace' }).click();
    await expect(page.getByRole('heading', { name: /Good to see you, Erin/ })).toBeVisible();
  });

  await test.step('add a customer', async () => {
    await page.getByRole('link', { name: 'Customers' }).click();
    await page.getByRole('button', { name: 'Add customer' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Company').fill('Client <b>Co</b>'); // markup must show as text
    await dialog.getByLabel('Contact person').fill('Casey Client');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: 'Client <b>Co</b>' })).toBeVisible();
  });

  let shareUrl = '';
  await test.step('build and send a quote', async () => {
    await page.getByRole('link', { name: 'New quote for this customer' }).click();
    await page.getByLabel('Title').fill('Website refresh');
    await page.getByLabel('Description').fill('Design sprint');
    await page.getByLabel('Qty').fill('2');
    await page.getByLabel('Unit price').fill('1000');

    // Live preview uses the shared calculation: 2 × 1,000 + 10 % tax.
    await expect(page.getByLabel('Preview').getByText('$2,200.00')).toBeVisible();
    await expect(page.getByText('All changes saved')).toBeVisible();

    await page.getByRole('button', { name: 'Send to client' }).click();
    shareUrl = await page.getByRole('dialog').getByRole('textbox').inputValue();
    expect(shareUrl).toMatch(/\/q\/[A-Za-z0-9_-]{43}$/);
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
    await expect(page.getByText('This quote has been sent')).toBeVisible();
  });

  await test.step('the client opens the link without an account and accepts', async () => {
    const client = await browser.newContext();
    const clientPage = await client.newPage();
    await clientPage.goto(shareUrl);
    await expect(clientPage.getByRole('heading', { name: 'Website refresh' })).toBeVisible();
    await clientPage.getByLabel('Your full name').fill('Casey Client');
    await clientPage.getByLabel(/I have read the quote/).check();
    await clientPage.getByRole('button', { name: 'Accept quote' }).click();
    await expect(clientPage.getByText(/Accepted by Casey Client/)).toBeVisible();
    await client.close();
  });

  await test.step('the studio sees the win', async () => {
    await page.getByRole('link', { name: 'Overview' }).click();
    await expect(page.getByText('100%')).toBeVisible();
    await expect(page.getByText('$2,200.00').first()).toBeVisible();
  });
});
