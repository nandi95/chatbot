# Using lightweight alpine image
FROM node:lts-alpine

# Working directory in docker image
WORKDIR /app

# Copying source files to the container
COPY . .

# Install dependencies
RUN npm install

# Transpile TypeScript files
RUN npm run build

CMD ["npm", "start"]
