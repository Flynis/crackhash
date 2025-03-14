# Fetching the latest node image on apline linux
FROM node:alpine

# Setting up the work directory
WORKDIR /app

# Setting up project
COPY ./package.json .
RUN npm install
COPY . .

CMD ["node", "main.js"]