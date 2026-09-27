FROM node:22-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --workspace backend --include-workspace-root
COPY backend backend
RUN npm run db:generate && npm run build:backend

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --omit=dev --workspace backend --include-workspace-root
COPY --from=build /workspace/backend/dist backend/dist
COPY --from=build /workspace/backend/prisma backend/prisma
COPY --from=build /workspace/node_modules/.prisma node_modules/.prisma
RUN mkdir -p backend/uploads backend/logs
WORKDIR /workspace/backend
EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/schema.prisma && node dist/server.js"]