FROM nginx:alpine

ENV BASE_PATH /Jamstash/

COPY dist /usr/share/nginx/html${BASE_PATH}

