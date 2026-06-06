import { test, expect } from "@playwright/test";

const USERNAME = "johnnytest";
const PASSWORD = "12345678";

test.describe("BruinPop signup flow", () => {
  test("shows validation errors for invalid username", async ({ page }) => {
    await page.goto("/signup");

    // Click to focus the field — rules appear immediately while focused
    await page.locator('input[autocomplete="username"]').click();

    // Empty username shows both errors
    await expect(page.getByText("✗6–20 characters")).toBeVisible();
    await expect(page.getByText("✗Letters, numbers, . - _ only")).toBeVisible();

    // Too short
    await page.locator('input[type="text"]').fill("john");
    await expect(page.getByText("✗6–20 characters")).toBeVisible();
    await expect(page.getByText("✓Letters, numbers, . - _ only")).toBeVisible();

    // Invalid character
    await page.locator('input[type="text"]').fill("johnnytest@");
    await expect(page.getByText("✗Letters, numbers, . - _ only")).toBeVisible();

    // Valid username
    await page.locator('input[type="text"]').fill("johnnytest");
    await expect(page.getByText("✓6–20 characters")).toBeVisible();
    await expect(page.getByText("✓Letters, numbers, . - _ only")).toBeVisible();
  });

  test("shows validation errors for invalid password", async ({ page }) => {
    await page.goto("/signup");

    // Too short password
    await page.getByRole("textbox").nth(1).fill("123456");
    await expect(page.getByText("✗At least 8 characters")).toBeVisible();

    // Valid password
    await page.getByRole("textbox").nth(1).fill("12345678");
    await expect(page.getByText("✓At least 8 characters")).toBeVisible();

    // Mismatched confirm password
    await page.getByRole("textbox").nth(2).fill("1234567");
    await expect(page.getByText("✗Passwords match")).toBeVisible();

    // Matching confirm password
    await page.getByRole("textbox").nth(2).fill("12345678");
    await expect(page.getByText("✓Passwords match")).toBeVisible();
  });

  test("shows error when username is already taken", async ({ page }) => {
    // Requires USERNAME account to already exist in the database
    await page.goto("/signup");
    await page.locator('input[type="text"]').fill(USERNAME);
    await page.getByRole("textbox").nth(1).fill(PASSWORD);
    await page.getByRole("textbox").nth(2).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign up" }).click();
    await expect(page.getByText("Username is already taken")).toBeVisible();
  });
});

test.describe("BruinPop post creation", () => {
  test("logged in user can create a post", async ({ page }) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateString = futureDate.toISOString().split("T")[0];

    // Login
    await page.goto("/login");
    await page.locator('input[type="text"]').fill(USERNAME);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL("/posts");

    // Create post
    await page.getByRole("combobox").selectOption("dickson-court");
    await page
      .getByRole("textbox", { name: "What are you posting about?" })
      .fill("testmaxxing");
    await page
      .getByRole("textbox", { name: "Add the details, RSVP info," })
      .fill("commentmaxxing");
    await page.locator('input[type="date"]').fill(dateString);
    await page.locator('input[type="time"]').fill("18:00");
    await page.getByRole("button", { name: "Other" }).first().click();
    await page.getByRole("button", { name: "Publish post" }).click();

    // Go to profile and verify post appears there
    await page.goto(`/profile/${USERNAME}`);
    await expect(page.getByRole("link", { name: /testmaxxing/ }).first()).toBeVisible();
  });
});

test.describe("BruinPop profile", () => {
  test("user can view and save their profile", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.locator('input[type="text"]').fill(USERNAME);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL("/posts");

    // Navigate to profile
    await page.goto(`/profile/${USERNAME}`);
    await page.getByRole("link", { name: "Edit Profile" }).click();
    await expect(page).toHaveURL("/profile/edit");

    // Save and verify redirect back to profile
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page).toHaveURL(`/profile/${USERNAME}`);
  });

  test("user can view their post from profile then delete it", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.locator('input[type="text"]').fill(USERNAME);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL("/posts");

    // Go to profile and click post
    await page.goto(`/profile/${USERNAME}`);
    await page.getByRole("link", { name: /testmaxxing/ }).first().click();

    // Verify post detail page
    await expect(page).toHaveURL(/\/posts\//);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText(`Author@${USERNAME}`)).toBeVisible();

    // Accept the confirm dialog and delete
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete post" }).click();
    await expect(page).toHaveURL(/\/posts/, { timeout: 10_000 });

    // Profile should now show no posts
    await page.goto(`/profile/${USERNAME}`);
    await expect(page.getByText("No posts yet.")).toBeVisible();
  });
});
