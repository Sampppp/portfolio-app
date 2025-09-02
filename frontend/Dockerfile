FROM nginx:alpine

# Remove default nginx website
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx configuration
COPY ./nginx/nginx.conf /etc/nginx/conf.d/

# Create directories
RUN mkdir -p /etc/nginx/ssl

# Copy frontend files to nginx document root
COPY ./src/ /usr/share/nginx/html/

# Copy SSL certificates (you'll need to provide these)
# COPY cert.pem /etc/nginx/ssl/
# COPY key.pem /etc/nginx/ssl/
