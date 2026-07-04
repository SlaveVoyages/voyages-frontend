# syntax=docker/dockerfile:1

# The build output is static files, so this stage runs once on the builder's
# native platform; only the nginx stage below is built per target platform.
FROM --platform=$BUILDPLATFORM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./

# @slavevoyages packages are hosted on GitHub Packages, which requires auth.
# The token is supplied as a BuildKit secret so it never lands in an image layer:
#   docker build --secret id=gh_npm_token,src=<file-with-token> .
RUN printf '@slavevoyages:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}\n' > .npmrc
RUN --mount=type=secret,id=gh_npm_token \
    NODE_AUTH_TOKEN="$(cat /run/secrets/gh_npm_token)" npm ci --no-audit --no-fund
# npm refuses to run any command (including `npm run build`) while .npmrc
# references an env var that is no longer set, so drop it after install.
RUN rm .npmrc

COPY . .

# Vite inlines VITE_* values into the bundle at build time, so the resulting
# image is specific to the environment these values point at.
ARG VITE_API_BASE_URL
ARG VITE_API_BASE_NODE_URL
ARG VITE_API_BASE_URL_FRONTEND
ARG VITE_API_AUTHTOKEN
ARG VITE_IIIF_MANIFESTS_BASEURL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV NODE_OPTIONS=--max_old_space_size=8192
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
