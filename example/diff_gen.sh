#!/bin/bash

cd ./gen

unzip_3mf() {
  file=$1
  dir=${1//./_}
  rm -Rf "${dir}" 2>/dev/null
  mkdir "${dir}"
  cd "${dir}"
  unzip -q "../${file}"
  rm "../${file}"
  cd ..
}

unzip_3mf EasiestHeart_fat.3mf
unzip_3mf EasiestHeart_pointy.3mf
unzip_3mf EasiestHeart_slim.3mf

cd ..

diff -r -I UUID -I CreationDate ./gen/ ./ref/
