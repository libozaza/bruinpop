import { test, expect } from "@playwright/test";

const PASSWORD = "alex12345";

// same helpers
function uniqueUsername(prefix) {
  const suffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 10000)}`;
  return `${prefix}${suffix}`.slice(0, 20).toLowerCase();
}
// future date helper
function futureDate(daysFromNow = 14) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}
async function signUp(page, username, password = PASSWORD) {
  await page.goto("/signup");
  await expect(
    page.getByRole("heading", { name: /Create your BruinPop account/i })
  ).toBeVisible();
  await page.locator('input[type="text"]').fill(username);
  await page.getByRole("textbox").nth(1).fill(password);
  await page.getByRole("textbox").nth(2).fill(password);
  await page.getByRole("button", { name: /^Sign up$/ }).click();
  await expect(page).toHaveURL(/\/posts/, { timeout: 15_000 });
  await expect(page.getByRole("link", { name: `@${username}` })).toBeVisible();
}

// automatically creates post with default values, can be easily customized and reused for other tests
async function createPost(
  page,
  {
    title,
    details,
    locationValue = "powell",
    locationLabel = "Powell Library",
    category = "Arts",
    date = futureDate(),
    time = "18:30",
  }
) {
  await page.goto("/posts");
  await expect(
    page.getByRole("heading", { name: /Create event/i })
  ).toBeVisible();
  await page.getByRole("combobox").selectOption(locationValue);
  await page
    .getByRole("textbox", { name: /What are you posting about/i })
    .fill(title);
  await page
    .getByRole("textbox", { name: /Add the details/i })
    .fill(details);
  await page.locator('input[type="date"]').fill(date);
  await page.locator('input[type="time"]').fill(time);
  await page.getByRole("button", { name: category, exact: true }).first().click();
  await page.getByRole("button", { name: /Publish post/i }).click();
  const post = page.getByRole("article").filter({ hasText: title }).first();
  await expect(post).toBeVisible({ timeout: 15_000 });
  await expect(post).toContainText(title);
  await expect(post).toContainText(locationLabel);
  await expect(post).toContainText(category);
  return post;
}

// main test
test("Task 2: logged-in user can create a campus post that appears in the feed and map area", async ({
  page,
}) => {
  // create unique info automatically
  const username = uniqueUsername("poster");
  const postTitle = `Powell Book Fair ${Date.now()}`;
  const postDetails =
    "UCLA Powell Library Book Fair this Saturday. Book signings from authors, student groups, and campus clubs.";
  await signUp(page, username);
  // make the post
  const post = await createPost(page, {
    title: postTitle,
    details: postDetails,
    locationValue: "powell",
    locationLabel: "Powell Library",
    category: "Arts",
  });
  // assert the post appears in the feed with correct details
  await expect(post).toContainText(postTitle);
  await expect(post).toContainText("Powell Library");
  await expect(post).toContainText("Arts");
  await expect(page.getByRole("complementary")).toContainText("Powell Library");
  await expect(page.getByRole("complementary")).toContainText("Arts");
  await expect(page.getByText(/\d+ events? on map/i)).toBeVisible();
});