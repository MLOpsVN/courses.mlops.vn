FROM python:3.9-slim AS build


RUN apt-get update
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install -r requirements.txt

WORKDIR /app
COPY . .
RUN mkdocs build


FROM nginx:stable-alpine

WORKDIR /usr/share/nginx/html

COPY ./deployment/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/site /usr/share/nginx/html

CMD ["/bin/sh", "-c", "nginx -g 'daemon off;'"]
