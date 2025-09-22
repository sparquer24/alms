# Frontend Dockerfile - builds the Next.js app and runs it in production
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY yarn.lock package-lock.json* ./
RUN npm ci --production=false || npm install

# Copy source
COPY . .

# Build the Next.js app
RUN npm run build

## Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --production

# Copy built app and next config
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/next.config.js ./next.config.js
COPY --from=build /app/package.json ./package.json

ENV PORT=5000
EXPOSE 5000

CMD ["npm", "run", "start"]
