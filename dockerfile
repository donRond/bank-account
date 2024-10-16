# Etapa 1: Build da aplicação
FROM node:18 AS builder

# Diretório de trabalho dentro do container
WORKDIR /app

# Copia o package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia todo o código da aplicação
COPY . .

# Build da aplicação
RUN npm run build

# Etapa 2: Execução da aplicação
FROM node:18 AS runner

# Diretório de trabalho
WORKDIR /app

# Copia os arquivos necessários da etapa de build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Define a variável de ambiente NODE_ENV como produção
ENV NODE_ENV=production

# Porta que a aplicação expõe
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["node", "dist/main.js"]
