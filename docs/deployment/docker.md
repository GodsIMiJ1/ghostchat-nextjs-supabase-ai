# Deploying with Docker

This guide will walk you through the process of deploying GhostChat using Docker, which allows you to run the application in a containerized environment.

## Prerequisites

Before you begin, make sure you have:

1. [Docker](https://www.docker.com/get-started) installed on your system
2. [Docker Compose](https://docs.docker.com/compose/install/) installed (optional, but recommended)
3. A [Supabase](https://supabase.com/) project set up
4. An [OpenAI](https://openai.com/) API key

## Step 1: Create a Dockerfile

Create a `Dockerfile` in the root of your project:

```dockerfile
# Use Node.js LTS as the base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG OPENAI_API_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set the user to non-root
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# Set environment variables
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["node", "server.js"]
```

## Step 2: Update Next.js Configuration

Update your `next.config.ts` file to enable standalone output:

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
};

module.exports = nextConfig;
```

## Step 3: Create a Docker Compose File

Create a `docker-compose.yml` file in the root of your project:

```yaml
version: '3'

services:
  ghostchat:
    build:
      context: .
      args:
        - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
        - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
        - OPENAI_API_KEY=${OPENAI_API_KEY}
    ports:
      - "3000:3000"
    restart: always
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

## Step 4: Create Environment Variables File

Create a `.env` file in the root of your project (this file should not be committed to version control):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-api-key
```

## Step 5: Build and Run the Docker Container

### Using Docker Compose (Recommended)

1. Build and start the container:

```bash
docker-compose up -d
```

2. View logs:

```bash
docker-compose logs -f
```

3. Stop the container:

```bash
docker-compose down
```

### Using Docker CLI

1. Build the Docker image:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  --build-arg OPENAI_API_KEY=your-openai-api-key \
  -t ghostchat .
```

2. Run the Docker container:

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -e OPENAI_API_KEY=your-openai-api-key \
  ghostchat
```

## Step 6: Configure Supabase Authentication

For authentication to work properly, you need to add your deployment URL to Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Authentication → URL Configuration
3. Add your deployment URL (e.g., `http://your-server-ip:3000`) to the "Site URL" field
4. Add the following redirect URLs:
   - `http://your-server-ip:3000/api/auth/callback`
   - `http://your-server-ip:3000/login`
5. Click "Save"

## Step 7: Set Up Reverse Proxy (Optional)

For production deployments, it's recommended to use a reverse proxy like Nginx:

1. Create an Nginx configuration file:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. Save this file to `/etc/nginx/sites-available/ghostchat`

3. Create a symbolic link:

```bash
sudo ln -s /etc/nginx/sites-available/ghostchat /etc/nginx/sites-enabled/
```

4. Test the configuration:

```bash
sudo nginx -t
```

5. Restart Nginx:

```bash
sudo systemctl restart nginx
```

## Step 8: Set Up SSL with Let's Encrypt (Optional)

For secure HTTPS connections:

1. Install Certbot:

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. Obtain an SSL certificate:

```bash
sudo certbot --nginx -d your-domain.com
```

3. Follow the prompts to complete the setup

## Production Deployment Considerations

### Docker Swarm or Kubernetes

For production deployments with high availability:

1. Consider using Docker Swarm or Kubernetes for orchestration
2. Set up multiple replicas for redundancy
3. Use a load balancer to distribute traffic

### Environment Variables

For production, consider using a secrets management solution:

1. Docker Swarm secrets
2. Kubernetes secrets
3. HashiCorp Vault

### Monitoring

Set up monitoring for your Docker containers:

1. Use Docker's built-in health checks
2. Implement Prometheus for metrics collection
3. Set up Grafana for visualization
4. Configure alerting for critical issues

### Logging

Implement a logging solution:

1. Configure Docker logging drivers
2. Use ELK Stack (Elasticsearch, Logstash, Kibana) or similar
3. Set up log rotation to manage disk space

## Troubleshooting

### Container Won't Start

If the container fails to start:

1. Check the Docker logs:

```bash
docker logs ghostchat
```

2. Verify that all environment variables are correctly set
3. Ensure the container has network access to Supabase and OpenAI

### Authentication Issues

If users can't sign in:

1. Verify that your Supabase Site URL is set to your deployment URL
2. Check that redirect URLs are correctly configured in Supabase
3. Ensure cookies are working properly (check for CORS issues)
4. Verify that your application is using HTTPS if required

### Performance Issues

If the application is slow:

1. Increase the resources allocated to the Docker container
2. Implement caching for API responses
3. Optimize the Next.js build for production

## Backup and Restore

### Backing Up

To back up your Docker deployment:

1. Back up environment variables
2. Back up Docker Compose configuration
3. Back up Nginx configuration (if applicable)
4. Back up Supabase database (through Supabase dashboard)

### Restoring

To restore your deployment:

1. Set up environment variables
2. Deploy the Docker container
3. Restore Supabase database (if needed)
4. Configure Nginx (if applicable)

## Updating the Application

To update your Docker deployment:

1. Pull the latest code changes
2. Rebuild the Docker image:

```bash
docker-compose build
```

3. Restart the container:

```bash
docker-compose down
docker-compose up -d
```

## Security Best Practices

1. **Use Non-Root User**: The Dockerfile already sets up a non-root user
2. **Scan Images**: Use Docker Scout or similar tools to scan for vulnerabilities
3. **Limit Resources**: Set resource limits for containers
4. **Secure Secrets**: Use environment variables or secrets management
5. **Regular Updates**: Keep base images and dependencies updated

## Conclusion

Deploying GhostChat with Docker provides a consistent, isolated environment that can be easily moved between development, staging, and production. By following this guide, you should have a containerized application that is ready for production use.
