# Production Setup Guide (`alms.sparquer.com`)

I've created dedicated production Docker and Nginx configurations for you:
1. `docker-compose.prod.yml`
2. `nginx/nginx.prod.conf`

To successfully deploy these to your production machine for `alms.sparquer.com`, please follow the comprehensive checklist below.

## 1. Domain & DNS Configuration

Ensure that your domain is correctly pointing to your production server's public IP address.

- **A Record**: Point `@` (or `alms`) to the production server IPv4 address.
- **A Record**: Point `www.alms` to the production server IPv4 address.
- *(Optional but recommended)* **AAAA Record**: Point to the server's IPv6 address if available.

> [!CAUTION]
> DNS propagation can take a few minutes to hours. Ensure `ping alms.sparquer.com` returns the correct IP before attempting to generate SSL certificates.

## 2. Obtain SSL Certificates (Let's Encrypt)

Certbot needs to run on your production server to get valid certificates for the new domain.

Run the following command on your production server (assuming Nginx is stopped, or using webroot if it's running without the new config):

```bash
sudo certbot certonly --standalone -d alms.sparquer.com -d www.alms.sparquer.com
```

This will place your certificates at `/etc/letsencrypt/live/alms.sparquer.com/`. 

> [!NOTE]
> `docker-compose.prod.yml` is already configured to map `/etc/letsencrypt/live/alms.sparquer.com/fullchain.pem` and `privkey.pem`. Ensure these paths match what Certbot outputs.

## 3. Production Environment Variables

You need to create a `.env.prod` file in your root tracking the required variables. Do NOT commit this to Git.

Create `.env.prod`:
```env
# Root Env Variables
NEXT_PUBLIC_API_URL=https://alms.sparquer.com/api
DATABASE_URL=postgres://user:password@production-rds-url.ap-south-1.rds.amazonaws.com:5432/alms_db
```

Create `./backend/.env.prod`:
```env
# Backend specific Variables
PORT=3000
NODE_ENV=production
DATABASE_URL=postgres://user:password@production-rds-url.ap-south-1.rds.amazonaws.com:5432/alms_db
JWT_SECRET=your_super_secure_randomly_generated_production_secret
# Add any other required backend API keys (SendGrid, AWS S3, etc)
```

## 4. Production Database setup

If you are using AWS RDS (as commented in the compose variables), make sure:

1. **Security Groups**: The RDS instance's security group allows inbound access on port 5432 from your production server's Elastic IP / Security Group.
2. **Migrations**: The Prisma schema migrations must be run against the production database before booting the backend.
   - Run `npx prisma migrate deploy` in your production deployment pipeline or manually on the backend codebase.

## 5. Build and Deploy

Once certificates are present, DNS is propagated, and `.env.prod` files are prepared, bring up the production containers.

```bash
# Build the images and start the containers in detached mode
docker-compose -f docker-compose.prod.yml up -d --build
```

### Checking the cluster

To ensure everything is running stably, check the logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```
Ensure no services are restart-looping (like `backend` failing to connect to Postgres).

## 6. Nginx Hardening and Limits

The provided `nginx.prod.conf` includes the following production-ready security improvements out-of-the-box:
- **Rate limiting** tailored for standard production traffic (20r/s general, 10r/s API limit).
- **HSTS** (Strict-Transport-Security) enabled with `always`.
- Extended SSL session timeout configured to `1d` to improve subsequent connection times.
- Blocking common web exploitation scanners by agent string and URL probes natively.
