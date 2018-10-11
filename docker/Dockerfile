FROM node:alpine

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm install

ENV DEBUG=openhpi*

EXPOSE 8080

CMD [ "node", "./index.js"]