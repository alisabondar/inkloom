import { expect, test } from '@playwright/test';

test('home shows the pitch, the idea prompt and every medium', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Every piece starts with a');
  await expect(page.getByLabel('Your idea')).toBeVisible();
  for (const medium of ['Pencil', 'Watercolor', 'Acrylic', 'Embroidery', 'Tattoo flash']) {
    await expect(page.getByRole('link', { name: medium, exact: true })).toBeVisible();
  }
});

test('an idea from the home page asks a signed-out visitor to sign in, then comes back', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your idea').fill('A fox in a teacup');
  await page.getByRole('button', { name: 'Start a piece →' }).click();

  await expect(page).toHaveURL(/\/create\?idea=A\+fox\+in\+a\+teacup/);
  await expect(page.getByRole('heading', { name: 'Sign in to start creating' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in', exact: true }).last()).toHaveAttribute('href', '/signin?next=%2Fcreate');
});

test('my projects is private: signed-out visitors go to sign in and return afterwards', async ({ page }) => {
  await page.goto('/projects');
  await expect(page).toHaveURL(/\/signin\?next=%2Fprojects|\/signin\?next=\/projects/);
  await expect(page.getByLabel('Email or username')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
});

test('a template that does not exist is a 404, not a crash', async ({ page }) => {
  const response = await page.goto('/t/00000000-0000-4000-8000-000000000000');
  expect(response?.status()).toBe(404);
});
