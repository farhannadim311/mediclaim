#!/usr/bin/env bash

echo "Enter email address: "
read EMAIL

curl -s localhost:8787/verify \
  -X POST \
  -H 'content-type: application/json' \
  -d "{\"email\": \"$EMAIL\"}" | jq

echo "What's the OTP: "
read OTP

curl -s localhost:8787/attestate \
  -X POST \
  -H 'content-type: application/json' \
  -d "{\"email\": \"$EMAIL\", \"proof\": {\"code\": \"$OTP\"}}" | jq
