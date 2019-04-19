FROM debian:9.8-slim

RUN apt-get -y update && apt-get -y install git

COPY start.sh /start.sh

RUN chmod +x /start.sh

CMD ["/start.sh"]
