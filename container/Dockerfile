FROM nginx:1.23.4-alpine-slim

ARG release_tag
ENV SW_RELEASE=${release_tag}

ADD govio-app.tgz /usr/share/nginx/html/
RUN mv /usr/share/nginx/html/dist/govio-app /usr/share/nginx/html/ ; \
  rmdir /usr/share/nginx/html/dist/

COPY container/default.conf /etc/nginx/conf.d/default.conf