# Используем официальный образ Node.js
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --production

# Копируем остальные файлы проекта
COPY . .

# Указываем порт, который будет использоваться
EXPOSE 3000

# Запускаем сервер
CMD ["node", "server.js"]
