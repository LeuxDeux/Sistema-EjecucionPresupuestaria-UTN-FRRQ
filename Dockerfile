FROM node:20.2.0

WORKDIR /frontend

COPY package*.json ./

RUN npm install

COPY . .

CMD npm start