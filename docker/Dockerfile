FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/config/package.json packages/config/package.json
RUN npm ci
COPY . .
RUN npm run db:generate && npm run build
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
USER node
EXPOSE 3000
CMD ["npm","run","start","-w","@mailpilot/backend"]
