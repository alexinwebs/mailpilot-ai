FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/config/package.json packages/config/package.json
RUN npm ci
COPY . .
RUN DATABASE_URL=postgresql://mailpilot:mailpilot@localhost:5432/mailpilot npm run db:generate && npm run build
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
RUN chmod 755 /app/docker/entrypoint.sh
USER node
EXPOSE 3000
CMD ["/app/docker/entrypoint.sh"]
