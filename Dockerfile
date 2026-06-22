# Etapa 1: Construir el Frontend (React/Vite)
FROM node:22-alpine AS builder
WORKDIR /app

# Copiar configuración y dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente y compilar
COPY . .
RUN npm run build

# Etapa 2: Configurar el Servidor Backend (Node.js)
FROM node:22-alpine
WORKDIR /app

# Copiar y instalar dependencias del servidor
COPY server/package*.json ./server/
RUN cd server && npm install

# Copiar el código del servidor
COPY server ./server

# Copiar la compilación del frontend desde la Etapa 1 a la carpeta dist/
COPY --from=builder /app/dist ./dist

# Variables de entorno y puerto de Google Cloud Run (por defecto 8080)
ENV PORT=8080
EXPOSE 8080

# Iniciar el servidor
WORKDIR /app/server
CMD ["node", "index.js"]
