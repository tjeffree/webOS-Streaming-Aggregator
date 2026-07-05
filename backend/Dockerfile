# handoff.md §5.1 — lightweight node:20-alpine base.
FROM node:20-alpine

WORKDIR /app

# Install production dependencies first so this layer caches across code edits.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Application source.
COPY src ./src

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run as the built-in non-root user shipped with the node image.
USER node

CMD ["node", "src/server.js"]
