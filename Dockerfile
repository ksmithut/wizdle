FROM node:18-alpine AS base

# Create app directory
RUN mkdir -p /app && chown node:node /app
USER node
WORKDIR /app

# Install dependencies
COPY --chown=node:node package.json yarn.lock ./
RUN yarn --frozen-lockfile

# Build client
COPY --chown=node:node postcss.config.cjs tailwind.config.cjs vite.config.js ./
COPY --chown=node:node client client
RUN yarn build

# Release layer
FROM node:18-alpine AS release

# Create app directory
RUN mkdir -p /app && chown node:node /app
USER node
WORKDIR /app

# Install dependencies
COPY --chown=node:node --from=base /app/package.json /app/yarn.lock ./
RUN yarn --frozen-lockfile --production

# Bundle app source
COPY --chown=node:node --from=base /app/public public
COPY --chown=node:node src src

# Exports
EXPOSE 3000
CMD [ "node", "src/index.js" ]
