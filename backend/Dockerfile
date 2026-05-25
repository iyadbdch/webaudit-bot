FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache chromium
COPY package*.json ./
RUN npm ci --production
COPY --from=build /app/dist ./dist
ENV LIGHTHOUSE_PATH=/usr/bin/chromium-browser
EXPOSE 4000
CMD ["node", "dist/main.js"]
