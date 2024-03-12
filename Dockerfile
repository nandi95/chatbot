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

# uninstall dev dependencies
RUN npm prune --omit=dev

# Remove all TypeScript files
RUN find ./src -name "*.ts" -type f -delete

# Remove unnecessary files
RUN rm tsconfig.json package-lock.json

CMD ["npm", "start"]
