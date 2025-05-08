FROM node:20-alpine

WORKDIR /app

# Copy application files
COPY . .

# Install dependencies
RUN npm install

# Build TypeScript
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "start:http"] 