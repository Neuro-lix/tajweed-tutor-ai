FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_SUPABASE_URL=https://etectgyjvkpqtpgypszv.supabase.co
ARG VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZWN0Z3lqdmtwcXRwZ3lwc3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzgzODAsImV4cCI6MjA4NzY1NDM4MH0.mxs-H4C66BwoVc7a4nsxt8T7B65VQOn5J0gZYqvOutk
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Run nginx as a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid && chown appuser:appgroup /var/run/nginx.pid \
    && sed -i 's/listen       80;/listen       8080;/g' /etc/nginx/conf.d/default.conf || true \
    && sed -i 's/listen 80;/listen 8080;/g' /etc/nginx/conf.d/default.conf || true
USER appuser
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
