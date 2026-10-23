FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY selfhost/package*.json ./selfhost/
WORKDIR /app/selfhost
RUN npm ci
WORKDIR /app
COPY components ./components
COPY lib/api.ts lib/types.ts ./lib/
COPY app/page.tsx app/globals.css ./app/
COPY selfhost ./selfhost
WORKDIR /app/selfhost
RUN npm run build

FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATABASE_PATH=/app/selfhost/data/bitacora.sqlite
WORKDIR /app/selfhost
COPY --from=builder /app/selfhost/dist ./dist
COPY selfhost/server.mjs selfhost/auth.mjs selfhost/database.mjs ./
COPY selfhost/scripts ./scripts
COPY selfhost/content ./content
RUN mkdir -p data && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node","server.mjs"]
