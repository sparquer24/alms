# Development Dockerfile — optimized for Docker layer caching
#
# Layer invalidation order (least → most frequently changing):
#   1. System packages (apk)
#   2. package.json / lockfile
#   3. Prisma schema
#   4. Entrypoint script
#   5. Source code

FROM node:22.19.0-alpine
WORKDIR /app

# Layer 1: Install all system build deps in one layer (rarely changes)
RUN apk add --no-cache --virtual .build-deps python3 make g++ gcc libc-dev linux-headers git \
    && apk add --no-cache dos2unix netcat-openbsd

# Layer 2: Install Node dependencies (cached until package.json / lockfile changes)
COPY package*.json ./
RUN npm install && apk del .build-deps

# Layer 3: Copy Prisma schema and generate client (cached unless schema changes)
COPY prisma/ ./prisma/
RUN npx prisma generate

# Layer 4: Copy entrypoint (rarely changes after setup)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN dos2unix /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

# Layer 5: Copy application source (changes most frequently)
COPY . .

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]
