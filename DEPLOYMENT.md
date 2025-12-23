# Vercel Deployment Guide

## Setup Vercel Postgres

### Step 1: Create Postgres Database in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (or create a new one)
3. Go to the **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a database name (e.g., "bookmarks-db")
7. Select a region (choose one close to your users)
8. Click **Create**

Vercel will automatically:
- Create the database
- Set the `POSTGRES_URL` environment variable in your project
- Make it available to all deployments

### Step 2: Deploy Your Application

#### Option A: Deploy via Vercel CLI (Recommended)

1. Install Vercel CLI if you haven't already:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy your project:
```bash
vercel
```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (if first time) or **Y** (if updating)
   - What's your project's name? Enter a name
   - In which directory is your code located? **.**
   - Want to override the settings? **N**

5. For production deployment:
```bash
vercel --prod
```

#### Option B: Deploy via GitHub

1. Push your code to GitHub:
```bash
git add .
git commit -m "Configure for Vercel deployment with Postgres"
git push origin master
```

2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Vercel will auto-detect the configuration
5. Click **Deploy**

### Step 3: Verify Database Connection

After deployment:
1. Visit your deployed URL (e.g., `https://your-app.vercel.app`)
2. Try creating a bookmark to test database connectivity
3. Check Vercel logs if there are any issues:
   - Go to your project dashboard
   - Click on **Deployments**
   - Click on the latest deployment
   - View the **Functions** logs

## Environment Variables

The following environment variables are automatically set by Vercel Postgres:
- `POSTGRES_URL` - Full connection string
- `POSTGRES_PRISMA_URL` - Connection string for Prisma
- `POSTGRES_URL_NON_POOLING` - Direct connection
- `POSTGRES_USER` - Database user
- `POSTGRES_HOST` - Database host
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DATABASE` - Database name

Your app uses `POSTGRES_URL` automatically.

## Local Development

For local development, the app will use SQLite. To test with the production database locally:

1. Get the database URL from Vercel:
   - Go to your project → **Storage** → Your Postgres database
   - Click **...** → **Connection String**
   - Copy the connection string

2. Create a `.env` file (don't commit this!):
```bash
POSTGRES_URL=your_connection_string_here
```

3. Install dependencies locally:
```bash
pip install -r requirements.txt
```

4. Run locally:
```bash
python app.py
```

## Troubleshooting

### Database connection errors
- Make sure the Postgres database is created in Vercel
- Check that environment variables are set in Vercel project settings
- Verify the database region matches your deployment region

### Static files not loading
- Ensure your static files are in the `/static` folder
- Check that vercel.json routes are configured correctly

### Function timeout
- Vercel free tier has a 10-second timeout
- Optimize database queries if needed
- Consider upgrading to Pro for 60-second timeout

## Monitoring

- View function logs: Project → Deployments → Latest → Functions
- Monitor database: Project → Storage → Your Database → Metrics
- Set up alerts in Vercel for errors

## Costs

- **Vercel Hobby (Free)**: Includes limited Postgres storage and compute
- **Vercel Pro**: $20/month with more generous limits
- Check current pricing: https://vercel.com/pricing

---

Your app is now configured for Vercel deployment with PostgreSQL!
