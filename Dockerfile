FROM node:20.2.0-alpine

WORKDIR /frontend

COPY package*.json ./

RUN npm install -g nodemon
RUN npm install
