import { test, expect } from "@playwright/test";

const PASSWORD = "alex12345";

// create username helper
function uniqueUsername(prefix) {
  const suffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 10000)}`;
  return `${prefix}${suffix}`.slice(0, 20).toLowerCase();
}
// logout helper for reuse
async function logout(page) {
  await page.getByRole("button", { name: /^Log out$/i }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  await expect(
    page.getByRole("heading", { name: /Login to BruinPop/i })
  ).toBeVisible();
}
// login helper for reuse
async function login(page, username, password = PASSWORD) {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: /Login to BruinPop/i })
  ).toBeVisible();
  await page.locator('input[autocomplete="username"]').fill(username);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await expect(page).toHaveURL(/\/posts/, { timeout: 15_000 });
  await expect(
    page.getByRole("link", { name: `@${username}` })
  ).toBeVisible();
}

// Main test
test("Task 1: user can sign up, edit profile, log out, and log back in", async ({
  page,
}) => {
  // create unique info automatically
  const username = uniqueUsername("profile");
  const bio = `Playwright test bio ${Date.now()}`;
  const profileImageUrl =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaz_XIGpVhpQit7QwUaVfl7fLktteiGsMMlg&s";

  await page.goto("/signup");

  // assert we're on the signup page
  await expect(
    page.getByRole("heading", { name: /Create your BruinPop account/i })
  ).toBeVisible();

  // locate the form fields and fill them out
  await page.locator('input[autocomplete="username"]').fill(username);
  await page.locator('input[autocomplete="new-password"]').first().fill(PASSWORD);
  await page.locator('input[autocomplete="new-password"]').last().fill(PASSWORD);
  await page.getByRole("button", { name: /^Sign up$/ }).click();
  await expect(page).toHaveURL(/\/posts/, { timeout: 15_000 });
  // assert that we're logged in by checking for the presence of the username link
  await expect(
    page.getByRole("link", { name: `@${username}` })
  ).toBeVisible();
  await page.getByRole("link", { name: `@${username}` }).click();
  await expect(
    page.getByRole("heading", { name: new RegExp(`^${username}$`, "i") })
  ).toBeVisible();
  await page.getByRole("link", { name: /^Edit Profile$/i }).click();
  await expect(
    page.getByRole("heading", { name: /^Edit Profile$/i })
  ).toBeVisible();
  // locate the profile editing fields, fill them out, and save
  const profilePictureInput = page.getByPlaceholder(
    "https://example.com/your-photo.jpg"
  );
  // use a variable here since checking using the name of the text box fails
  const bioTextarea = page.getByPlaceholder("Tell people about yourself…");
  await expect(profilePictureInput).toBeVisible();
  await expect(bioTextarea).toBeVisible();
  await profilePictureInput.fill(profileImageUrl);
  await bioTextarea.fill(bio);
  await expect(profilePictureInput).toHaveValue(profileImageUrl);
  await expect(bioTextarea).toHaveValue(bio);
  await page.getByRole("button", { name: /^Save Changes$/i }).click();
  await expect(page.getByText(/Saved!\s*Redirecting/i)).toBeVisible({
    timeout: 10_000,
  });
  await expect(page).toHaveURL(new RegExp(`/profile/${username}$`), {
    timeout: 10_000,
  });
  await expect(page.getByRole("main")).toContainText(bio);
  await logout(page);
  await login(page, username);
  await expect(
    page.getByRole("link", { name: `@${username}` })
  ).toBeVisible();
});