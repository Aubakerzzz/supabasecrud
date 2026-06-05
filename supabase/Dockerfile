FROM denoland/deno:alpine-1.37.0

WORKDIR /app

# Copy functions
COPY functions/ ./functions/

# Cache dependencies
RUN deno cache ./functions/products/index.ts

EXPOSE 54321

CMD ["deno", "run", "-A", "--allow-net", "--allow-env", "./functions/products/index.ts"]