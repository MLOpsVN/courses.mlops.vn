#!/bin/bash

rm site
mkdocs build
mv site/ mlopsvn-crash-course/

rm mlopsvn-crash-course.zip
zip -r mlopsvn-crash-course.zip mlopsvn-crash-course
rm -rf mlopsvn-crash-course
