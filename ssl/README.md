# SSL Certificate Setup with Let's Encrypt

This directory contains scripts and configuration for setting up SSL certificates using Let's Encrypt with Docker.

## Quick Setup

1. **Update your email address** in `init-letsencrypt.sh`:
   ```bash
   email="your-email@example.com"  # Replace with your actual email
   ```

2. **Run the initialization script**:
   ```bash
   ./ssl/init-letsencrypt.sh
   ```

3. **Start the services**:
   ```bash
   docker-compose -f docker-compose.ssl.yml up -d
   ```

## What the Setup Does

### 1. Initial Certificate Generation
The `init-letsencrypt.sh` script:
- Creates a temporary dummy certificate to start nginx
- Downloads recommended TLS parameters from Let's Encrypt
- Requests a real certificate from Let's Encrypt
- Automatically reloads nginx with the new certificate

### 2. Automatic Renewal
The `certbot` service in `docker-compose.ssl.yml`:
- Runs in the background
- Automatically renews certificates every 12 hours
- Reloads nginx every 6 hours to pick up renewed certificates

### 3. Nginx Configuration
The `nginx-ssl.conf` file:
- Handles HTTP to HTTPS redirects
- Serves Let's Encrypt challenge files for certificate validation
- Uses proper SSL security settings
- Includes security headers

## Files Explained

- `init-letsencrypt.sh` - One-time setup script for obtaining initial certificates
- `setup-ssl.sh` - Legacy script (for manual server setup, not Docker)
- `nginx-ssl.conf` - Nginx configuration optimized for Let's Encrypt
- `docker-compose.ssl.yml` - Docker Compose file with SSL support

## Troubleshooting

### Certificate Not Found Error
If you get the error about missing certificates:
```
cannot load certificate "/etc/letsencrypt/live/thisguyisreallycool.sp4k.live/fullchain.pem"
```

This means you need to run the initialization script first:
```bash
./ssl/init-letsencrypt.sh
```

### Domain Not Accessible
Make sure your domain points to your server's IP address:
```bash
dig thisguyisreallycool.sp4k.live
```

### Rate Limiting
If you hit Let's Encrypt rate limits during testing, set `staging=1` in `init-letsencrypt.sh` to use the staging environment.

### Certificate Renewal Issues
Check the certbot logs:
```bash
docker-compose -f docker-compose.ssl.yml logs certbot
```

## Manual Certificate Renewal
If needed, you can manually renew certificates:
```bash
docker-compose -f docker-compose.ssl.yml run --rm certbot renew
docker-compose -f docker-compose.ssl.yml exec nginx nginx -s reload
```

## Security Notes

- Certificates are stored in `./ssl/certbot/conf/`
- Private keys have restricted permissions
- HSTS headers are enabled for enhanced security
- TLS 1.2 and 1.3 are supported with secure cipher suites

## Production Checklist

- [ ] Update email address in `init-letsencrypt.sh`
- [ ] Verify domain DNS points to your server
- [ ] Run `./ssl/init-letsencrypt.sh`
- [ ] Start services with `docker-compose -f docker-compose.ssl.yml up -d`
- [ ] Test HTTPS access to your domain
- [ ] Verify certificate auto-renewal is working
