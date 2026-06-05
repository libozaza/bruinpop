This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Local Deployment

First, install dependencies:

```bash
npm ci
```

Then setup environment variables for MongoDB, NextAuth, and Pusher as described in the sections below. Environment variables should be in a file titled .env.local

Finally, start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## MongoDB Details
First, install dependencies:
```bash
npm install next-auth bcryptjs mongoose
```

Signup for MongoDB account

Step 1: Go to cloud.mongodb.com, click Try Free, sign up with Google or email

Step 2:
Click Create and select M0 Free

Pick AWS as the provider

Set region to us-west-2 (Oregon or anything) closest to LA

Name it whatever

Click Create Deployment

Step 3: Create a database user

Atlas will prompt you immediately after cluster creation:

Username: something simple like bruinpop-admin

Password: click autogenerate and copy it somewhere safe

Click Create Database User

Step 4: When asked where to connect from, click Allow Access from Anywhere

This adds 0.0.0.0/0 — required for multiple person access remotely

Click Finish and Close

Step 5: Create the database and collection

In the left sidebar click Data Explorer

Click Add My Own Data

Database Name: bruinpop or whatever

Collection Name: users or whatever

Click Create

Step 6: Get your connection string

Go back to your cluster and click Connect

Choose Drivers

Select Node.js and copy the string

Add bruinpop before the ? so it reads:

mongodb+srv://bruinpop-admin:<password>@bruinpop-cluster.xxxxx.mongodb.net/bruinpop?retryWrites=true&w=majority

Replace <password> with the password you saved in Step 3

Step 7: Add to your project

Paste the connection string into .env.local:

MONGODB_URI=mongodb+srv://bruinpop-admin:<password>@bruinpop-cluster.xxxxx.mongodb.net/bruinpop?retryWrites=true&w=majority


## NextAuth Details
Use the following command to set up NEXTAUTH_SECRET.
```bash
npx auth secret
```

```.env
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

## Pusher Details
Create a Pusher account at [pusher.com](https://pusher.com/) and a pusher channels project. Then fill in the following env variables that can be found in the project dashboard under the tab App Keys:

```.env
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=

NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
```

## Playwright Details
First, install Playwright dependencies using the following commands in the following order.
```bash
npm init playwright@latest
npx playwright install
```

IMPORTANT!!! If using Linux, you will be prompted to install Linux-specific dependencies and libraries. Make sure to run:
```bash
npx playwright install --with-deps
```

Our test files are located in the root at ./e2e, look to the playwright.config.js for any configurations; videos have been left on by default and are recorded each run --> check test-results or playwright-report to watch.

To run a the full suite of tests, simply run:
 ```bash
npx playwright test
```

To run an individual test, simply add the file in question, e.g.:
 ```bash
npx playwright test e2e/auth-signup-login-profile.spec.js
```

## Diagrams
![UML Sequence Diagram depicting post creation](./assets/post-creation.svg)

This diagram depicts the flow of post creation, which mirrors the flow for live-updating post interactions and deletions. The feed subscribes to pusher, which is notified by the server when a post is created to notify the feed, which merges the new post. For the actual post, the poster uses POST /api/posts to send the information to the server, which then queries the database to save the post. The server then notifies the pusher as discussed above.

<img width="1368" height="1134" alt="NextAuth" src="https://github.com/user-attachments/assets/14a9b072-2fbc-4554-8663-03646134f5ac" />

This diagram shows the sequence flow associated with the nextAuth authentication. The login page calls signIn("credentials"), which sends the username and password to the NextAuth API route at /api/auth/[...nextauth]. NextAuth then uses the CredentialsProvider defined in lib/auth.js to run authorize(), where the app looks up the user in MongoDB and validates the submitted credentials. If authentication succeeds, NextAuth creates a JWT session, adds the user ID to the token, copies it into session.user.id, and returns the successful login result to the client. The login page then redirects the user to /posts. If authentication fails, it displays an invalid username/password error.

## GenAI Use Ratios:
Harry Zheng: I used GenAI mostly for creating frontend jsx page structure and css styling. Most of the logic was implemented myself. I would say 85% of the work is my own.

Alex Zhang: I used GenAI for the classNames of frontend jsx pages and tailwind css styling. Implemented all jsx logic and conditionals myself. Also used it for some formatting. Most of the backend logic (API calls, authentication logic, database implementation/calls) was implemented on my own. I'd guess that 80% of the lines I wrote were my own.

Ethan Xin: I used GenAI for most of the website's frontend design and designing with tailwind css and jsx. I also used AI to familiarize myself with the code logic and understand the current structure to make backend connections myself. Most backend logic was my own (such as API routing functions and PATCH handlers). I would estimate ~70-75% of the work is my own.
