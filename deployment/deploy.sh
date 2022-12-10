#!/bin/bash

cmd=$1

if [[ -z "$cmd" ]]; then
    echo "Missing command"
    exit 1
fi

gen_image_info() {
    IMAGE_PATH="${IMAGE_PATH:-mlopsvn/courses.mlops.vn}"
    IMAGE_TAG="${IMAGE_TAG:-$(git describe --always)}"
}

build() {
    gen_image_info
    if [[ -z "$SITE_PASSWORD" ]]; then
        echo "Build without password"
    else
        echo "Build with password '$SITE_PASSWORD'"
    fi
    docker build --build-arg SITE_PASSWORD=$SITE_PASSWORD --tag $IMAGE_PATH:$IMAGE_TAG -f deployment/Dockerfile .
    docker tag $IMAGE_PATH:$IMAGE_TAG $IMAGE_PATH:latest
}

push() {
    gen_image_info
    docker push $IMAGE_PATH:$IMAGE_TAG
    docker push $IMAGE_PATH:latest
}

shift

case $cmd in
build)
    build "$@"
    ;;
push)
    push "$@"
    ;;
*)
    echo -n "Unknown command: $cmd"
    exit 1
    ;;
esac
