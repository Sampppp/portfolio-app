Cross-Origin Resource Sharing (CORS) is a web security mechanism that allows web pages to make requests to a different domain, protocol, or port than the one serving the web page. It's implemented through HTTP headers and provides a way to relax the same-origin policy in a controlled manner.

**The Same-Origin Policy Background**
By default, web browsers enforce the same-origin policy, which blocks web pages from making requests to a different origin (different domain, protocol, or port) for security reasons. This prevents malicious websites from accessing sensitive data from other sites.

**How CORS Works**
When a web application needs to make a cross-origin request, CORS uses specific HTTP headers to communicate between the browser and server:

1. **Simple requests** (like basic GET or POST requests) are sent directly, and the server responds with CORS headers indicating whether the request is allowed.

2. **Complex requests** trigger a "preflight" check - the browser first sends an OPTIONS request to ask if the actual request is permitted.

**Key CORS Headers**
- `Access-Control-Allow-Origin`: Specifies which origins can access the resource
- `Access-Control-Allow-Methods`: Lists allowed HTTP methods
- `Access-Control-Allow-Headers`: Specifies allowed request headers
- `Access-Control-Allow-Credentials`: Indicates if credentials can be included

**Common Use Cases**
- APIs serving multiple web applications
- Loading fonts or assets from CDNs
- Making AJAX requests to third-party services
- Microservices architectures where frontend and backend are on different domains

CORS is essential for modern web development, enabling legitimate cross-origin communication while maintaining security boundaries.

**Example of a Malicious Attack Without Same-Origin Policy**

A classic example is a **Cross-Site Request Forgery (CSRF)** attack combined with data theft:

1. You're logged into your bank at `bank.com` in one browser tab
2. You visit a malicious website `evil.com` in another tab
3. Without same-origin policy, `evil.com` could run JavaScript that makes requests to `bank.com/api/account-balance` or `bank.com/transfer-money`
4. Since you're logged in, your browser would automatically include your authentication cookies with these requests
5. The malicious site could read your account information or perform unauthorized transactions

Another example is **session hijacking** - a malicious site could read authentication tokens or session data from other origins and use them for unauthorized access.

**CORS is Essentially a Whitelist System**

CORS works exactly like a controlled whitelist that allows servers to selectively permit cross-origin requests:

- **Default behavior**: All cross-origin requests are blocked
- **Explicit permission**: Servers must explicitly specify which origins, methods, and headers are allowed
- **Granular control**: You can be very specific (allow only `https://myapp.com` to make GET requests) or more permissive (allow any origin with `*`)

For example, an API might configure CORS like this:
```
Access-Control-Allow-Origin: https://myapp.com
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type, Authorization
```

This would only allow the specific domain `myapp.com` to make GET and POST requests with those specific headers - everything else remains blocked by the browser's same-origin policy.