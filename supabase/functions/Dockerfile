# VidChain Edge Functions Dockerfile
# Based on Supabase Edge Runtime

FROM denoland/deno:1.40.2

WORKDIR /home/deno/functions

# Copy function files
COPY . .

# Create non-root user
RUN addgroup --system --gid 1001 deno && \
    adduser --system --uid 1001 --ingroup deno deno && \
    chown -R deno:deno /home/deno

USER deno

# Expose the edge functions port
EXPOSE 54321

# Start the edge runtime
CMD ["run", "--allow-all", "serve.ts"]
