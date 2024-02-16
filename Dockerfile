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
RUN npm prune --production
# Remove all TypeScript files
RUN find . -type f -name "*.ts" -delete
RUN rm tsconfig.json
RUN rm package-lock.json

CMD ["npm", "start"]
