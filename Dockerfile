# Use Node image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Run Next.js
CMD ["npm", "start"]