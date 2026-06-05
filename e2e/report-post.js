import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('navigation').getByRole('link', { name: 'Log in' }).click();
  await page.locator('input[type="text"]').click();
  await page.locator('input[type="text"]').fill('playwright');
  await page.locator('input[type="password"]').click();
  await page.locator('input[type="password"]').fill('alex12345');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('article').filter({ hasText: 'P@playwrightplaywrightNewWhen' })).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.locator('input[type="text"]').click();
  await page.locator('input[type="text"]').fill('playwright3');
  await page.locator('input[type="password"]').click();
  await page.locator('input[type="password"]').fill('notnow123');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('article').filter({ hasText: 'P@playwrightplaywrightNewWhen' })).toBeVisible();
  await page.getByRole('article').filter({ hasText: 'P@playwrightplaywrightNewWhen' }).click();
  await page.getByRole('button', { name: 'Report' }).click();
  await page.locator('label').filter({ hasText: 'Spam or scamMisleading' }).click();
  await expect(page.getByRole('textbox', { name: 'Optional note' })).toBeVisible();
  await expect(page.getByText('Optional note')).toBeVisible();
  await page.getByRole('textbox', { name: 'Optional note' }).click();
  await page.getByRole('textbox', { name: 'Optional note' }).fill('Fake user!');
  await page.getByRole('button', { name: 'Submit report' }).click();
  await page.getByRole('link', { name: '← Back to posts' }).click();
  await page.getByText('Hide Reported Posts').click();
});