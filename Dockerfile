FROM node:20-alpine AS base

# Create app directory
RUN mkdir -p /app && chown node:node /app
USER node
WORKDIR /app

# Install dependencies
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

# Build client
COPY --chown=node:node postcss.config.cjs tailwind.config.cjs vite.config.js ./
COPY --chown=node:node client client
RUN npm run build

# Release layer
FROM node:20-alpine AS release

# Create app directory
RUN mkdir -p /app && chown node:node /app
USER node
WORKDIR /app

# Install dependencies
COPY --chown=node:node --from=base /app/package.json /app/package-lock.json ./
RUN npm ci --production

# Bundle app source
COPY --chown=node:node --from=base /app/public public
COPY --chown=node:node src src

# Exports
EXPOSE 3000
CMD [ "node", "src/index.js" ]
