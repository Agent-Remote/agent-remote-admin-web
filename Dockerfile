FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html tsconfig.json tsconfig.node.json vite.config.ts ./
COPY src ./src

ARG VITE_AGENT_REMOTE_API_BASE=
ENV VITE_AGENT_REMOTE_API_BASE=$VITE_AGENT_REMOTE_API_BASE
RUN npm run build

FROM nginx:1.27-alpine

ARG AGENT_REMOTE_VERSION=0.0.3
ENV AGENT_REMOTE_VERSION=$AGENT_REMOTE_VERSION

LABEL org.opencontainers.image.version=$AGENT_REMOTE_VERSION

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN printf '{"version":"%s"}\n' "$AGENT_REMOTE_VERSION" > /usr/share/nginx/html/version.json
EXPOSE 80
