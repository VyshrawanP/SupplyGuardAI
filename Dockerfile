# Use a lightweight Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package manifests and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Vite React frontend
RUN npm run build

# Expose the port the Express server runs on
EXPOSE 3000

# Start the server using tsx
CMD ["npx", "tsx", "server.ts"]
