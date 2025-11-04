FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN npm install -g @nestjs/cli
COPY . .
RUN npm run build
CMD ["node", "dist/main.js"]
