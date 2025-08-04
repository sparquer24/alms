# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your NestJS app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:dev"]
