# Deployment Guide

## Frontend Deployment (Vercel)

### Prerequisites
- GitHub account
- Vercel account (free tier works)

### Steps

1. **Push your code to GitHub** (already done)

2. **Import Project to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the `frontend` directory as root directory

3. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Root Directory: `frontend`

4. **Set Environment Variables**
   - `VITE_API_URL` = Your Railway backend URL + `/api`
   - Example: `https://your-app.railway.app/api`

5. **Deploy**
   - Click "Deploy"
   - Vercel will automatically deploy on every push to main

### Custom Domain (Optional)
- Go to Project Settings → Domains
- Add your custom domain
- Configure DNS as instructed

## Backend Deployment (Railway)

### Prerequisites
- GitHub account
- Railway account (free tier: $5/month credit)

### Steps

1. **Create New Project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Service**
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Set Environment Variables**
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = Generate a strong secret (e.g., use `openssl rand -base64 32`)
   - `FRONTEND_URL` = Your Vercel frontend URL
   - `PORT` = `3001` (Railway auto-assigns, but we set default)

4. **Generate Domain**
   - In service settings, click "Generate Domain"
   - Copy the Railway URL (e.g., `https://f1-tipping-production.up.railway.app`)
   - Use this URL + `/api` for the frontend's `VITE_API_URL`

5. **Seed the Database**
   - Railway will run the app
   - The database will be auto-initialized on first run
   - To manually seed, use Railway CLI:
     ```bash
     railway run npm run seed
     ```

### Custom Domain (Optional)
- In service settings → Networking
- Add custom domain
- Configure DNS CNAME record

## Post-Deployment Setup

### 1. Create Admin User
After first deployment, you'll need to create an admin user:

```bash
# Connect to Railway service
railway run sh

# Access SQLite database
sqlite3 database.sqlite

# Update a user to admin (replace username)
UPDATE users SET is_admin = 1 WHERE username = 'your-username';
```

Or use Railway's database connection string to access remotely.

### 2. Test the Application
1. Visit your Vercel frontend URL
2. Register a new account
3. Make the account admin (via database)
4. Test all features:
   - Season predictions with drag-and-drop
   - Race predictions
   - Leaderboard
   - Validations
   - Admin panel

### 3. Update CORS
Ensure your backend allows requests from your Vercel domain:
- Already configured via `FRONTEND_URL` environment variable
- Backend uses this for CORS whitelist

## Monitoring & Maintenance

### Railway Dashboard
- View logs: Project → Service → Logs
- Monitor resource usage
- Set up alerts for downtime

### Vercel Dashboard
- View deployment logs
- Analytics and performance metrics
- Set up notifications

### Database Backups
Railway SQLite is ephemeral by default. For production:

**Option 1: Railway Volume**
- Add a volume in Railway settings
- Mount at `/app/backend`
- Database will persist across deploys

**Option 2: Upgrade to PostgreSQL**
- Railway offers PostgreSQL addon
- Update backend code to use PostgreSQL instead of SQLite
- More scalable for production

## Troubleshooting

### Frontend can't connect to backend
- Check `VITE_API_URL` is set correctly in Vercel
- Ensure Railway service is running
- Check CORS configuration

### Database not seeding
- Railway auto-initializes on first run
- Manually seed: `railway run npm run seed`
- Check logs for errors

### Build failures
- Check Node version compatibility (v18+)
- Verify all dependencies in package.json
- Check build logs for specific errors

## Cost Estimates

### Free Tier Limits
- **Vercel**: Unlimited bandwidth, 100GB/month
- **Railway**: $5/month free credit (~550 hours runtime)

### Scaling Costs
- **Vercel**: Free for hobby projects
- **Railway**: $5/month covers small app, ~$10-20/month for active usage
- **Total**: ~$0-10/month for small user base (5-20 players)

## Backup Strategy

### Database Backups
Railway doesn't auto-backup SQLite files. Set up periodic backups:

1. **Manual Backup**
   ```bash
   railway run sqlite3 database.sqlite .dump > backup.sql
   ```

2. **Automated Backups**
   - Use Railway Cron Jobs
   - Or set up GitHub Actions to backup periodically

3. **Export to Excel**
   - Users can export leaderboard data anytime
   - Admin should regularly export data

## Troubleshooting

### Frontend Issues
- **Build fails**: Check Node version (v18+ required)
- **Blank page**: Check browser console for API errors
- **API errors**: Verify `VITE_API_URL` is correct

### Backend Issues
- **Database not found**: Run seed script via Railway CLI
- **CORS errors**: Check `FRONTEND_URL` environment variable
- **Authentication fails**: Verify `JWT_SECRET` is set

### Logs
- **Backend**: Railway dashboard → Logs
- **Frontend**: Vercel dashboard → Deployments → Logs

## Scaling & Costs

### Vercel Free Tier
- Unlimited deployments
- 100 GB bandwidth/month
- Serverless functions (frontend only)

### Railway Free Tier
- $5 monthly credit
- ~500 hours of service uptime
- Sufficient for 5-20 users
- Upgrade to Hobby ($5/month) for more resources

### Database Growth
SQLite is stored on Railway's ephemeral file system:
- Use Railway volumes for persistent storage (recommended)
- Or switch to Railway PostgreSQL for production

## Troubleshooting

### Frontend Issues
- **404 on routes**: Check vercel.json rewrites
- **API errors**: Verify `VITE_API_URL` is correct
- **Build fails**: Check Node.js version (use v18+)

### Backend Issues
- **Database not seeding**: Run `railway run npm run seed` manually
- **CORS errors**: Verify `FRONTEND_URL` environment variable
- **500 errors**: Check Railway logs for details

### Common Issues

**"Failed to fetch" errors**
- Check CORS configuration
- Verify `VITE_API_URL` is set correctly
- Ensure Railway service is running

**Database Issues**
- Railway provides ephemeral filesystem
- Database persists via volumes
- Backup database periodically via Railway CLI

**Authentication Errors**
- Ensure `JWT_SECRET` is set in Railway
- Same secret must be used across restarts
- Check CORS configuration

## Costs

### Free Tier Limits
- **Vercel**: Unlimited hobby projects, generous bandwidth
- **Railway**: $5 free credit/month, then pay-as-you-go
  - ~$5-10/month for small apps
  - Scales with usage

### Optimization Tips
- Backend: Shut down when not in use (Railway sleeps after inactivity)
- Frontend: Vercel is serverless, only charges for bandwidth
- Database: SQLite file persists in Railway's volume

## Troubleshooting

### Frontend Issues
- Check Vercel deployment logs
- Verify `VITE_API_URL` environment variable
- Test API connectivity from browser console

### Backend Issues
- Check Railway logs: `railway logs`
- Verify environment variables are set
- Check database initialization
- Test endpoints with curl/Postman

### CORS Errors
- Ensure `FRONTEND_URL` matches exact Vercel URL
- Include protocol (https://)
- No trailing slash

### Database Issues
- Railway persists SQLite file in volume
- To reset: redeploy or delete volume
- To backup: use Railway's volume backup feature

## Cost Estimates

### Vercel (Frontend)
- Free tier: Unlimited bandwidth, 100GB bandwidth
- Pro ($20/month): More bandwidth, better support
- Recommended: Start with free tier

### Railway (Backend)
- Free tier: $5 credit/month (~500 hours)
- Starter ($5/month): $5 credit + pay as you go
- Recommended: Starter plan for production

**Total Cost: $0-5/month for small leagues**

## Scaling Considerations

For larger leagues (50+ players):
- Consider PostgreSQL instead of SQLite
- Use Railway's PostgreSQL plugin
- Update database connection in `backend/src/db/database.ts`
- Add connection pooling

## Backup Strategy

### Automated Backups
1. Railway automatic volume backups (daily)
2. Database export via admin panel (manual)
3. Git version control for code

### Manual Backup
```bash
# Connect to Railway
railway run sh

# Copy database
cp database.sqlite backup-$(date +%Y%m%d).sqlite

# Download via Railway CLI or dashboard
```

## Support & Troubleshooting

### Common Issues

**Frontend can't reach backend**
- Check CORS configuration
- Verify API URL in environment variables
- Check Railway service is running

**Admin can't access admin panel**
- Verify user has is_admin = 1 in database
- Check JWT token includes admin flag

**Predictions not saving**
- Check browser console for errors
- Verify deadline hasn't passed
- Check backend logs for validation errors

### Getting Help
- Check Railway logs first
- Check Vercel function logs
- Test API endpoints directly
- Review this deployment guide

## Production Checklist

Before going live:
- [ ] Change JWT_SECRET to strong secret
- [ ] Update FRONTEND_URL to production URL
- [ ] Test all prediction forms
- [ ] Test admin panel
- [ ] Create at least one admin user
- [ ] Test deadline enforcement
- [ ] Verify CORS works from frontend
- [ ] Test Excel export
- [ ] Mobile responsiveness check
- [ ] Set up monitoring/alerts

## Updates & Maintenance

### Deploying Updates
- **Frontend**: Push to GitHub, Vercel auto-deploys
- **Backend**: Push to GitHub, Railway auto-deploys
- Both support preview deployments for branches

### Database Migrations
- SQLite is file-based, handle carefully
- Backup before schema changes
- Use Railway volume backups
- Consider PostgreSQL for production

### Monitoring
- Railway: Built-in metrics and logs
- Vercel: Analytics and Web Vitals
- Set up UptimeRobot for availability monitoring
