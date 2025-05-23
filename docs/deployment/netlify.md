# Deploying to Netlify

This guide will walk you through the process of deploying GhostChat to Netlify, a popular platform for hosting web applications.

## Prerequisites

Before you begin, make sure you have:

1. A [GitHub](https://github.com/) account
2. A [Netlify](https://netlify.com/) account
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

## Step 2: Configure for Netlify

1. Create a `netlify.toml` file in the root of your project:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NEXT_TELEMETRY_DISABLED = "1"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

2. Install the Netlify Next.js plugin as a dev dependency:

```bash
npm install -D @netlify/plugin-nextjs
```

3. Update your `next.config.ts` file to be compatible with Netlify:

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['your-supabase-project.supabase.co'],
    unoptimized: true,
  },
};

module.exports = nextConfig;
```

## Step 3: Set Up Netlify Project

1. Log in to your [Netlify dashboard](https://app.netlify.com/)
2. Click "Add new site" and select "Import an existing project"
3. Choose "GitHub" as your Git provider
4. Authorize Netlify to access your GitHub account
5. Select the repository containing your GhostChat project

## Step 4: Configure Build Settings

In the Netlify site settings:

1. Build command: `npm run build`
2. Publish directory: `.next`
3. Click "Show advanced" and add the following environment variables:

| Key | Value | Description |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` | Your Supabase anonymous key |
| `OPENAI_API_KEY` | `your-openai-api-key` | Your OpenAI API key |

## Step 5: Deploy

1. Click "Deploy site" to start the deployment process
2. Netlify will build and deploy your application
3. Once complete, you'll receive a deployment URL (e.g., `https://ghostchat-yourusername.netlify.app`)

## Step 6: Set Up Custom Domain (Optional)

To use a custom domain:

1. Go to your site in the Netlify dashboard
2. Click on "Domain settings"
3. Click "Add custom domain"
4. Enter your domain name and follow the instructions to configure DNS settings

## Step 7: Configure Supabase Authentication

For authentication to work properly, you need to add your deployment URL to Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Authentication → URL Configuration
3. Add your Netlify deployment URL (or custom domain) to the "Site URL" field
4. Add the following redirect URLs:
   - `https://your-domain.com/api/auth/callback`
   - `https://your-domain.com/login`
5. Click "Save"

## Continuous Deployment

Netlify automatically sets up continuous deployment from your GitHub repository:

1. When you push changes to your repository, Netlify will automatically rebuild and redeploy your application
2. You can view deployment history in the Netlify dashboard
3. Each pull request gets a unique preview URL for testing before merging

## Environment Management

Netlify provides different environments for your application:

1. **Production**: Your main deployment
2. **Branch Deploys**: Deployments from specific branches
3. **Deploy Previews**: Deployments from pull requests

You can configure different environment variables for each environment:

1. Go to your site in the Netlify dashboard
2. Click on "Site settings" → "Build & deploy" → "Environment"
3. Add environment-specific variables using the "Scope to branch/context" option

## Netlify Functions

GhostChat uses API routes, which are automatically converted to Netlify Functions:

1. API routes in `src/app/api` are deployed as serverless functions
2. You can view function logs in the Netlify dashboard under "Functions"
3. Functions have a default timeout of 10 seconds, which can be increased in the settings

## Monitoring and Logs

To monitor your application:

1. Go to your site in the Netlify dashboard
2. Click on "Analytics" to view performance metrics
3. Click on "Functions" to view function logs
4. Set up integrations with monitoring services like Sentry or LogRocket

## Troubleshooting Deployment Issues

### Build Failures

If your build fails:

1. Check the build logs in the Netlify dashboard
2. Ensure all dependencies are correctly specified in `package.json`
3. Verify that your environment variables are correctly set
4. Make sure your project builds locally with `npm run build`

### Runtime Errors

If your application deploys but doesn't work correctly:

1. Check the Function Logs in the Netlify dashboard
2. Verify that your Supabase URL and API keys are correct
3. Ensure your Supabase authentication settings are properly configured
4. Check that your OpenAI API key is valid and has sufficient credits

### Next.js Specific Issues

If you encounter Next.js specific issues:

1. Make sure you're using the `@netlify/plugin-nextjs` plugin
2. Check that your `next.config.ts` is properly configured
3. Ensure you're using compatible Next.js features (some advanced features may require additional configuration)

## Performance Optimization

To optimize your Netlify deployment:

1. **Edge Functions**: Consider using Netlify Edge Functions for API routes that need low latency
2. **Image Optimization**: Configure Next.js Image component for optimized image loading
3. **Caching**: Implement caching strategies for API responses
4. **Code Splitting**: Ensure your application uses code splitting for faster initial load times

## Scaling

As your application grows:

1. **Functions**: Monitor your Netlify Functions usage and upgrade your plan if needed
2. **Database**: Monitor your Supabase usage and upgrade your plan if needed
3. **OpenAI API**: Keep track of your OpenAI API usage and set up usage limits

## Security Best Practices

1. **Environment Variables**: Never commit sensitive information to your repository
2. **API Rate Limiting**: Implement rate limiting for your API routes
3. **Content Security Policy**: Set up appropriate CSP headers
4. **Regular Updates**: Keep your dependencies updated to patch security vulnerabilities

## Costs

Be aware of potential costs:

1. **Netlify**: Free tier includes limited build minutes and function invocations
2. **Supabase**: Free tier includes limited database storage and bandwidth
3. **OpenAI API**: Charged based on token usage

Monitor your usage to avoid unexpected charges.

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Next.js Plugin Documentation](https://github.com/netlify/netlify-plugin-nextjs)
- [Next.js on Netlify Documentation](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)

## Example: Netlify CLI Deployment

You can also deploy using the Netlify CLI:

1. Install the Netlify CLI:

```bash
npm install -g netlify-cli
```

2. Log in to your Netlify account:

```bash
netlify login
```

3. Initialize your site:

```bash
netlify init
```

4. Deploy your site:

```bash
netlify deploy --prod
```

## Conclusion

Deploying GhostChat to Netlify provides a scalable, reliable hosting solution with continuous deployment. By following this guide, you should have a production-ready application accessible to users worldwide.
