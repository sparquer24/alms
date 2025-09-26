# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
# Install build dependencies required for compiling native modules (bcrypt, etc.),
# run npm install, then remove build deps to keep the image small.
RUN apk add --no-cache --virtual .build-deps python3 make g++ gcc libc-dev linux-headers git \
	&& npm install \
	&& apk del .build-deps || true

# Copy the rest of the application code
COPY . .

# Generate Prisma client so @prisma/client is available at runtime
RUN npx prisma generate || true

# Expose the port your NestJS app runs on
EXPOSE 3000
# Copy entrypoint and make executable
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Start the application; entrypoint will ensure prisma client generation at container start
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]
