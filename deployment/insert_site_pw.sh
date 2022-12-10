#!/bin/bash

sed -i "s/# global_password: SITE_PASSWORD_HERE/global_password: $SITE_PASSWORD/" mkdocs.yml
