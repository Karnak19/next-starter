# syntax=docker/dockerfile:1

########################################
# Stage 1: build with Bun
########################################
# bun automatically reads ./bunfig.toml ([install] linker = "hoisted").
# This is mandatory: Turbopack rejects Bun's default isolated linker
# symlinks, and `next build` fails without the hoisted install.
FROM oven/bun:1 AS build

WORKDIR /app

# Dependency layer: cached unless bunfig/manifest/lockfile change.
COPY bunfig.toml package.json bun.lock ./
RUN bun install --frozen-lockfile

# Application source (.dockerignore keeps secrets/build output out).
COPY . .

# NEXT_PUBLIC_* variables are INLINED by `next build`: they must be passed
# as build args and set in the build-stage environment — setting them only
# at runtime has NO effect. Add one ARG + ENV pair per NEXT_PUBLIC_* var.
# (Coolify: set these as build args, not just runtime env vars.)
ARG NEXT_PUBLIC_POCKETBASE_URL
ENV NEXT_PUBLIC_POCKETBASE_URL=$NEXT_PUBLIC_POCKETBASE_URL \
    NEXT_TELEMETRY_DISABLED=1

# POCKETBASE_URL is ALSO required at build time: next.config.ts evaluates
# the /api/pocketbase rewrite destination from it, and the result is baked
# into routes-manifest.json. The runtime env alone cannot change the proxy
# target. Defaults to the compose-internal service name.
ARG POCKETBASE_URL=http://pocketbase:8080
ENV POCKETBASE_URL=$POCKETBASE_URL

RUN bun run build

########################################
# Stage 2: slim standalone runtime
########################################
# Node — not Bun — runs the standalone output: server.js is a Node script.
# node:22-slim (glibc) matches the build image's libc, so the sharp
# binaries traced into .next/standalone keep working for next/image.
FROM node:22-slim AS runtime

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Dedicated non-root user.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

# `output: "standalone"` bundles server.js with a traced node_modules subset…
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
# …but .next/static and public/ live OUTSIDE the standalone output and are
# NOT copied automatically — forgetting them breaks CSS/JS and public files.
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# Writable cache dir for the "use cache" handler (prerender/fetch cache).
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3000

# node:22-slim has no curl/wget — use node's built-in fetch for the probe.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
