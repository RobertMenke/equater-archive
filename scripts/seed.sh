#!/usr/bin/env bash

command -v ts-node || npm i -g ts-node

while getopts ":u:" opt; do
  case ${opt} in
    u)
      echo "Seeding $OPTARG users (this may take a few seconds)." >&2
      NODE_ENV=development ts-node ./test/scripts/local-dev-seeds.ts -u $OPTARG
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done
