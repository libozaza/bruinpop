import { test, expect } from "@playwright/test";

const PASSWORD = "hello123";

// same helpers
function uniqueUsername(prefix) {
  const suffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 10000)}`;
  return `${prefix}${suffix}`.slice(0, 20).toLowerCase();
}
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
async function logout(page) {
  await page.getByRole("button", { name: /Log out/i }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
}
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

// finds post by title, reusable
async function findPostByTitle(page, title) {
  const response = await page.request.get("/api/posts");
  expect(response.ok()).toBeTruthy();
  const posts = await response.json();
  const post = posts.find((candidate) => candidate.title === title);
  expect(post, `Expected to find post titled "${title}"`).toBeTruthy();
  return post;
}

// GREAT REFACTOR - a helper function that cleanly fetches the post values we want to check from the API, so we can reuse it for multiple assertions 
async function readPostValues(page, postId) {
  const response = await page.request.get(`/api/posts/${postId}`);
  expect(response.ok()).toBeTruthy();
  const post = await response.json();
  return {
    totalVotes: post.totalVotes,
    userVote: post.userVote,
    rsvpCount: post.rsvpCount,
    hasRsvpd: post.hasRsvpd,
    shares: post.shares,
    comments: post.comments,
    commentListLength: post.commentList?.length ?? 0,
    latestComment: post.commentList?.at(-1)?.content ?? null,
    hostHypeScore: post.hostHype?.hypeScore ?? 0,
  };
}
// implementation of readPostValues with polling to handle async updates, so we can assert the expected values after interactions that update the post
async function expectPostValues(page, postId, expectedValues) {
  await expect
    .poll(
      async () => {
        const actualValues = await readPostValues(page, postId);
        return Object.fromEntries(
          Object.keys(expectedValues).map((key) => [key, actualValues[key]])
        );
      },
      {
        timeout: 10_000,
      }
    )
    .toEqual(expectedValues);
}

// main test
test("Task 3: guest interactions update votes, RSVP, shares, comments, and host hype correctly", async ({
  page,
}) => {
  await page.context().grantPermissions(["clipboard-write"]);
  // first host creates a post
  const hostUsername = uniqueUsername("host");
  const guestUsername = uniqueUsername("guest");
  const postTitle = `Interaction Hype Test ${Date.now()}`;
  const postDetails = "Fresh post created by Playwright to verify interaction values and host hype changes.";
  const commentText = `Amazing book fair opportunity ${Date.now()}!`;
  await signUp(page, hostUsername);
  await createPost(page, {
    title: postTitle,
    details: postDetails,
    locationValue: "powell",
    locationLabel: "Powell Library",
    category: "Arts",
  });
  const createdPost = await findPostByTitle(page, postTitle);
  const postId = createdPost.id || createdPost._id;
  // assert initial values of the post before interactions
  await expectPostValues(page, postId, {
    totalVotes: 0,
    rsvpCount: 0,
    shares: 0,
    comments: 0,
    commentListLength: 0,
    hostHypeScore: 0,
  });
  await logout(page);
  // guest host signs up and interacts with the post
  await signUp(page, guestUsername);
  await page.goto(`/posts/${postId}`);
  const postArticle = page.getByRole("article").filter({ hasText: postTitle });
  await expect(postArticle).toBeVisible({ timeout: 15_000 });
  await expect(postArticle).toContainText(postTitle);
  await expect(postArticle).toContainText(`@${hostUsername}`);
  await page.getByRole("button", { name: /^Upvote$/ }).click();
  // asserts upvote
  await expectPostValues(page, postId, {
    totalVotes: 1,
    userVote: 1,
    rsvpCount: 0,
    shares: 0,
    comments: 0,
    commentListLength: 0,
    hostHypeScore: 1,
  });
  // test downvote
  await page.getByRole("button", { name: /^Downvote$/ }).click();
  await expectPostValues(page, postId, {
    totalVotes: -1,
    userVote: -1,
    rsvpCount: 0,
    shares: 0,
    comments: 0,
    commentListLength: 0,
    hostHypeScore: 0,
  });
  // test RSVP 
  await page.getByRole("button", { name: /^RSVP$/ }).click();
  await expect(page.getByRole("button", { name: /Cancel RSVP/i })).toBeVisible();
  await expectPostValues(page, postId, {
    totalVotes: -1,
    userVote: -1,
    rsvpCount: 1,
    hasRsvpd: true,
    shares: 0,
    comments: 0,
    commentListLength: 0,
    hostHypeScore: 1,
  });
  // test share
  await page.getByRole("button", { name: /^Share$/ }).click();
  await expect(postArticle).toContainText(/Copied link/i);
  await expectPostValues(page, postId, {
    totalVotes: -1,
    userVote: -1,
    rsvpCount: 1,
    hasRsvpd: true,
    shares: 1,
    comments: 0,
    commentListLength: 0,
    hostHypeScore: 2,
  });
  // write a comment and assert
  await page
    .getByRole("textbox", { name: /Write a comment/i })
    .fill(commentText);
  await expect(
    page.getByRole("textbox", { name: /Write a comment/i })
  ).toHaveValue(commentText);
  await page.getByRole("button", { name: /Post comment/i }).click();
  await expect(page.getByRole("main")).toContainText(commentText);
  await expectPostValues(page, postId, {
    totalVotes: -1,
    userVote: -1,
    rsvpCount: 1,
    hasRsvpd: true,
    shares: 1,
    comments: 1,
    commentListLength: 1,
    latestComment: commentText,
    hostHypeScore: 3,
  });
});