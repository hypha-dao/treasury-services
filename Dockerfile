FROM node:16.11.1
RUN mkdir /hypha-btc-treasury-api-code
RUN mkdir /bws-credentials
WORKDIR /hypha-btc-treasury-api-code
COPY . /hypha-btc-treasury-api-code
RUN npm install
