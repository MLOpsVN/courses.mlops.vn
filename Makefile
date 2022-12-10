SHELL=/bin/bash

# export SITE_PASSWORD="site-password" to build with password
build_image:
	bash deployment/deploy.sh build

push_image:
	bash deployment/deploy.sh push

compose_up:
	docker-compose -f deployment/docker-compose.yml up -d

compose_down:
	docker-compose -f deployment/docker-compose.yml down
