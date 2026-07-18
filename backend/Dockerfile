# --- EduEnterprise API image ------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# Install production dependencies first (better layer caching).
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy application source.
COPY src ./src

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Run as the non-root user shipped with the node image.
USER node

CMD ["node", "src/index.js"]
