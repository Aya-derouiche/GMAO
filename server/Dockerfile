FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p /app/uploads && chown -R node:node /app

USER node
EXPOSE 3001
CMD ["node", "server.js"]
