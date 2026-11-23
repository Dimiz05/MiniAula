FROM node:24-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p /app/uploads/portadas && chown -R node:node /app/uploads
USER node
EXPOSE 3000

CMD ["node", "scripts/docker-start.js"]
