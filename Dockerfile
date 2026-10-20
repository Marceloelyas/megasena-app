FROM node:20-alpine

# Dependências nativas do better-sqlite3 em Alpine
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Pasta de dados persistente
RUN mkdir -p /app/data
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV DB_PATH=/app/data/mega.db
ENV TZ=America/Sao_Paulo

EXPOSE 3000

CMD ["node", "server.js"]
