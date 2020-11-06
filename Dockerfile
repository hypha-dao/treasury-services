FROM ubuntu:18.04
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections
RUN mkdir /hypha-btc-treasury-api-code
RUN mkdir /bws-credentials
WORKDIR /hypha-btc-treasury-api-code
RUN apt update
RUN apt install apt-utils -y
RUN apt install curl -y
RUN curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh
RUN chmod u+x nodesource_setup.sh
RUN ./nodesource_setup.sh
RUN apt install nodejs -y
COPY . /hypha-btc-treasury-api-code
RUN npm install
