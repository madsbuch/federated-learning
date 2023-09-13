# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
FROM oven/bun:latest as base

# Node.js app lives here
WORKDIR /app

# Throw-away build stage to reduce size of final image
FROM base as build

COPY --link . .
RUN bun install
RUN bun test

WORKDIR /app/packages/server

EXPOSE 4000
CMD [ "bun", "run", "src/index.ts" ]
