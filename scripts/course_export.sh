#!/bin/bash

mkdocs build

mv site/ mlopsvn-crash-course/

zip -r mlopsvn-crash-course.zip mlopsvn-crash-course

rm -rf mlopsvn-crash-course
