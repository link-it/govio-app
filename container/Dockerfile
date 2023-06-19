FROM nginx:1.23.4-alpine-slim

ENV SW_RELEASE=1.1.0
RUN wget -q --no-check-certificate --header 'Authorization: Bearer glpat-zvzcnyYMxg-A-ipAaQai' -O - \
  https://gitlab.link.it/gitlab/api/v4/projects/155/packages/generic/govio-app/${SW_RELEASE}/govio-app-${SW_RELEASE}.tgz | tar -xzf- -C /usr/share/nginx/html/ ;\
  mv /usr/share/nginx/html/dist/govio-app /usr/share/nginx/html/ ; \
  rmdir /usr/share/nginx/html/dist/
COPY default.conf /etc/nginx/conf.d/default.conf