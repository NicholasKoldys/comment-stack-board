FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENV NODE_ENV=production

# RUN addgroup -S basicgroup && adduser -S basicuser -G basicgroup

# USER basicuser

CMD [ "npm", "start" ]