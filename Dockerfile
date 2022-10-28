FROM node:18-alpine

# Needed for bcrypt
# RUN apk --no-cache add --virtual builds-deps build-base python2

# Create app directory
RUN mkdir -p /app && chown node:node /app
USER node
WORKDIR /app

# Install dependencies
COPY --chown=node:node package.json yarn.lock ./
RUN yarn --frozen-lockfile
COPY --chown=node:node postcss.config.cjs tailwind.config.cjs vite.config.js ./

# Bundle app source
COPY --chown=node:node src src
RUN yarn build
COPY --chown=node:node public public

# Exports
EXPOSE 3000
CMD [ "node", "src/index.js" ]
