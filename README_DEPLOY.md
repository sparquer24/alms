# Deployment guide (EC2 + Docker + Nginx)

This document summarizes the minimal steps to deploy this project on a single EC2 instance running Docker.

Prerequisites
- An EC2 instance with Docker and docker-compose installed.
- SSH access and knowledge of how to upload repository files to the instance.

Quick steps
1. On your EC2 host, clone or copy the project into a directory (e.g. `/home/ubuntu/alms`).
2. Create a `.env` file from `.env.example` and fill in secrets. DO NOT commit `.env`.
   - For production behind nginx, set `NEXT_PUBLIC_API_URL=/api` in the `.env` so the frontend uses same-origin API calls.
   - Set `DATABASE_URL=postgres://<user>:<password>@postgres:5432/<db>` so the backend container can connect to the compose Postgres.

3. From the project root on EC2, start the stack:

```bash
docker compose up -d --build
```

4. (Optional) Run Prisma migrations if needed:

```bash
docker compose run --rm backend npm run prisma:migrate
```

5. Verify services are running:

```bash
docker compose ps
docker compose logs -f nginx
```

Notes
- The repository contains separate `Dockerfile.prod` files (added) for building production images for `frontend` and `backend`. Local dev Dockerfiles and compose files are unchanged.
- Nginx in the `docker-compose.yml` is configured to listen on port 80 and proxy `/api/*` to `backend` and all other requests to `frontend`.
- If you want HTTPS, put a reverse proxy or load balancer in front of the EC2 instance (recommended) or configure Certbot inside the nginx container and mount certs.

Troubleshooting
- If the backend cannot connect to Postgres, ensure `DATABASE_URL` points to `postgres:5432` and Postgres started without error (see `docker compose logs postgres`).
- If Next.js APIs or pages return 404, confirm the `NEXT_PUBLIC_API_URL` value used at build-time is correct. If you changed `NEXT_PUBLIC_API_URL` after the image was built, rebuild the frontend image.
