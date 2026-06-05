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

## Diagrams
