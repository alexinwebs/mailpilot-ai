#!/bin/sh
set -eu

npm run db:migrate
exec npm run start -w @mailpilot/backend