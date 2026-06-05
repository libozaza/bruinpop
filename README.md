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
This adds 0.0.0.0/0 — required for Vercel's dynamic IPs
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

## Diagrams
