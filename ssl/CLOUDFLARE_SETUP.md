# Cloudflare SSL Setup Guide

This guide provides step-by-step instructions for setting up SSL certificates with Let's Encrypt when using Cloudflare DNS.

## Prerequisites Completed ✅

You've already completed these steps:
- ✅ Created A record pointing to your server IP
- ✅ Set up port forwarding (80, 443)
- ✅ Disabled Cloudflare proxy (gray cloud)

## SSL Certificate Setup

### Step 1: Run the SSL Setup Script

Execute the new Cloudflare-compatible SSL setup script:

```bash
./ssl/init-letsencrypt-cloudflare.sh
```

This script will:
1. **Stage 1**: Start nginx with HTTP-only configuration
2. **Stage 2**: Request Let's Encrypt certificate via HTTP challenge
3. **Stage 3**: Switch to full SSL configuration
4. **Verify**: Test HTTPS connectivity

### Step 2: Monitor the Process

The script provides colored output to show progress:
- 🔵 **Blue**: Information messages
- 🟢 **Green**: Success messages
- 🟡 **Yellow**: Warnings
- 🔴 **Red**: Errors

### Step 3: Verify SSL Setup

After the script completes, run the verification script:

```bash
./ssl/verify-ssl.sh
```

This will check:
- Certificate file existence
- Certificate validity and expiration
- Docker services status
- HTTP to HTTPS redirect
- HTTPS connectivity
- SSL certificate serving

## Cloudflare Configuration Options

### Option 1: Keep Proxy Disabled (Recommended Initially)
- **DNS Setting**: Gray cloud (DNS only)
- **Benefits**: Direct connection, easier troubleshooting
- **SSL/TLS Setting**: Keep at "Full"

### Option 2: Re-enable Proxy (After SSL Works)
- **DNS Setting**: Orange cloud (Proxied)
- **SSL/TLS Setting**: Change to "Full (Strict)" for maximum security
- **Benefits**: DDoS protection, CDN, additional security features

## SSL/TLS Settings Explained

### Current Setting: Full ✅
- **What it does**: Encrypts connection between Cloudflare and your server
- **Certificate requirement**: Valid SSL certificate on your server
- **Status**: Perfect for your setup

### Recommended After Setup: Full (Strict)
- **What it does**: Same as Full, but validates certificate authority
- **Certificate requirement**: Valid SSL certificate from trusted CA (Let's Encrypt ✅)
- **Benefits**: Maximum security, prevents man-in-the-middle attacks

### Settings to Avoid:
- **Flexible**: Only encrypts visitor to Cloudflare (not secure)
- **Off**: No encryption (not recommended)

## Troubleshooting

### If Certificate Request Fails

1. **Check DNS propagation**:
   ```bash
   dig thisguyisreallycool.sp4k.live
   ```

2. **Verify port forwarding**:
   ```bash
   curl -I http://thisguyisreallycool.sp4k.live
   ```

3. **Check nginx logs**:
   ```bash
   docker compose -f docker-compose.http-only.yml logs nginx
   ```

### If HTTPS Doesn't Work After Setup

1. **Check certificate files**:
   ```bash
   ls -la ssl/certbot/conf/live/thisguyisreallycool.sp4k.live/
   ```

2. **Check nginx SSL logs**:
   ```bash
   docker compose -f docker-compose.ssl.yml logs nginx
   ```

3. **Verify certificate validity**:
   ```bash
   openssl x509 -in ssl/certbot/conf/live/thisguyisreallycool.sp4k.live/fullchain.pem -text -noout
   ```

## Post-Setup Steps

### 1. Test Your Site
Visit: https://thisguyisreallycool.sp4k.live

### 2. SSL Labs Test (Optional)
Check your SSL configuration at:
https://www.ssllabs.com/ssltest/analyze.html?d=thisguyisreallycool.sp4k.live

### 3. Re-enable Cloudflare Proxy (Optional)
If you want Cloudflare's additional features:
1. Go to Cloudflare DNS settings
2. Click the gray cloud next to your A record
3. It should turn orange (Proxied)
4. Change SSL/TLS setting to "Full (Strict)"

### 4. Monitor Certificate Renewal
Certificates auto-renew via the certbot container. Check renewal status:
```bash
docker compose -f docker-compose.ssl.yml logs certbot
```

## Certificate Management

### Manual Renewal (if needed)
```bash
docker compose -f docker-compose.ssl.yml run --rm certbot renew
docker compose -f docker-compose.ssl.yml exec nginx nginx -s reload
```

### Check Certificate Expiration
```bash
openssl x509 -in ssl/certbot/conf/live/thisguyisreallycool.sp4k.live/fullchain.pem -noout -enddate
```

### View Certificate Details
```bash
openssl x509 -in ssl/certbot/conf/live/thisguyisreallycool.sp4k.live/fullchain.pem -text -noout
```

## Security Best Practices

1. **Keep certificates updated**: Auto-renewal handles this
2. **Use HSTS headers**: Already configured in nginx
3. **Regular security scans**: Use SSL Labs or similar tools
4. **Monitor certificate expiration**: Set up alerts if needed
5. **Keep Docker images updated**: Regularly update certbot and nginx images

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review script output for error messages
3. Check Docker logs for detailed error information
4. Verify Cloudflare settings match this guide

The setup is designed to be robust and handle common Cloudflare + Let's Encrypt integration issues automatically.
