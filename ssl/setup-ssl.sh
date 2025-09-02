#!/bin/bash

# Install certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d thisguyisreallycool.sp4k.live

# Set up auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -