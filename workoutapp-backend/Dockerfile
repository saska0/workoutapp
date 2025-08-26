# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

WORKDIR /app
ENV NODE_ENV="production"

# Install build tools
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Copy package files and install all dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy app source code
COPY . .

EXPOSE 8080

CMD ["npx", "ts-node", "index.ts"]
