# Deploying to Vercel

This guide will walk you through the process of deploying GhostChat to Vercel, a popular platform for hosting Next.js applications.

## Prerequisites

Before you begin, make sure you have:

1. A [GitHub](https://github.com/) account
2. A [Vercel](https://vercel.com/) account
3. A [Supabase](https://supabase.com/) project set up
4. An [OpenAI](https://openai.com/) API key

## Step 1: Prepare Your Repository

1. Push your GhostChat project to a GitHub repository:

```bash
# Initialize Git repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit"

# Add remote repository
git remote add origin https://github.com/yourusername/ghostchat.git

# Push to GitHub
git push -u origin main
```

## Step 2: Set Up Vercel Project

1. Log in to your [Vercel dashboard](https://vercel.com/dashboard)
2. Click "Add New" and select "Project"
3. Import your GitHub repository
4. Select the repository containing your GhostChat project
5. Vercel will automatically detect that it's a Next.js project

## Step 3: Configure Environment Variables

In the Vercel project setup page, add the following environment variables:

| Name | Value | Description |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` | Your Supabase anonymous key |
| `OPENAI_API_KEY` | `your-openai-api-key` | Your OpenAI API key |

To find these values:

- **Supabase URL and Anon Key**: Go to your Supabase project dashboard → Settings → API
- **OpenAI API Key**: Go to your OpenAI dashboard → API Keys

## Step 4: Deploy

1. Click "Deploy" to start the deployment process
2. Vercel will build and deploy your application
3. Once complete, you'll receive a deployment URL (e.g., `https://ghostchat-yourusername.vercel.app`)

## Step 5: Set Up Custom Domain (Optional)

To use a custom domain:

1. Go to your project in the Vercel dashboard
2. Click on "Settings" → "Domains"
3. Add your domain and follow the instructions to configure DNS settings

## Step 6: Configure Supabase Authentication

For authentication to work properly, you need to add your deployment URL to Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Authentication → URL Configuration
3. Add your Vercel deployment URL (or custom domain) to the "Site URL" field
4. Add the following redirect URLs:
   - `https://your-domain.com/api/auth/callback`
   - `https://your-domain.com/login`
5. Click "Save"

## Continuous Deployment

Vercel automatically sets up continuous deployment from your GitHub repository:

1. When you push changes to your repository, Vercel will automatically rebuild and redeploy your application
2. You can view deployment history in the Vercel dashboard
3. Each commit gets a unique preview URL for testing before merging to the main branch

## Environment Management

Vercel provides different environments for your application:

1. **Production**: Your main deployment
2. **Preview**: Deployments from pull requests
3. **Development**: Local development environment

You can configure different environment variables for each environment:

1. Go to your project in the Vercel dashboard
2. Click on "Settings" → "Environment Variables"
3. Add environment-specific variables using the dropdown menu

## Monitoring and Logs

To monitor your application:

1. Go to your project in the Vercel dashboard
2. Click on "Analytics" to view performance metrics
3. Click on "Logs" to view application logs
4. Set up integrations with monitoring services like Sentry or LogRocket

## Troubleshooting Deployment Issues

### Build Failures

If your build fails:

1. Check the build logs in the Vercel dashboard
2. Ensure all dependencies are correctly specified in `package.json`
3. Verify that your environment variables are correctly set
4. Make sure your project builds locally with `npm run build`

### Runtime Errors

If your application deploys but doesn't work correctly:

1. Check the Function Logs in the Vercel dashboard
2. Verify that your Supabase URL and API keys are correct
3. Ensure your Supabase authentication settings are properly configured
4. Check that your OpenAI API key is valid and has sufficient credits

### Authentication Issues

If users can't sign in:

1. Verify that your Supabase Site URL is set to your Vercel deployment URL
2. Check that redirect URLs are correctly configured in Supabase
3. Ensure cookies are working properly (check for CORS issues)
4. Verify that your application is using HTTPS

## Performance Optimization

To optimize your Vercel deployment:

1. **Edge Functions**: Consider using Vercel Edge Functions for API routes that need low latency
2. **Image Optimization**: Use Next.js Image component for optimized image loading
3. **Caching**: Implement caching strategies for API responses
4. **Code Splitting**: Ensure your application uses code splitting for faster initial load times

## Scaling

As your application grows:

1. **Serverless Functions**: Vercel automatically scales serverless functions based on demand
2. **Database**: Monitor your Supabase usage and upgrade your plan if needed
3. **OpenAI API**: Keep track of your OpenAI API usage and set up usage limits

## Security Best Practices

1. **Environment Variables**: Never commit sensitive information to your repository
2. **API Rate Limiting**: Implement rate limiting for your API routes
3. **Content Security Policy**: Set up appropriate CSP headers
4. **Regular Updates**: Keep your dependencies updated to patch security vulnerabilities

## Costs

Be aware of potential costs:

1. **Vercel**: Free tier includes limited serverless function execution
2. **Supabase**: Free tier includes limited database storage and bandwidth
3. **OpenAI API**: Charged based on token usage

Monitor your usage to avoid unexpected charges.

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)

## Example: Deployment Script

You can automate deployment with a script:

```bash
#!/bin/bash

# Build the application
npm run build

# Run tests
npm test

# Deploy to Vercel
vercel --prod
```

Save this as `deploy.sh` and make it executable with `chmod +x deploy.sh`.

## Conclusion

Deploying GhostChat to Vercel provides a scalable, reliable hosting solution with continuous deployment. By following this guide, you should have a production-ready application accessible to users worldwide.
