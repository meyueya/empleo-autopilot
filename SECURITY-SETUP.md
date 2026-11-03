# Local security setup

Generate AUTOPILOT_API_TOKEN with `openssl rand -hex 32` and put it in your ignored local `.env`. Never use a VITE_ prefix for this secret. Restart backend and Vite after changes. Open http://127.0.0.1:5173. The loopback-only Vite proxy supplies the bearer header on local API/SSE/CSV requests; production requires an equivalent authenticated gateway. Direct/mobile clients must send Authorization: Bearer. Do not expose the Vite development server publicly.

The backend requires the token, binds loopback, restricts origins, rate-limits requests, redacts configured secret fields from settings responses, and preserves existing secrets when empty form fields are submitted. Manual URLs require HTTPS/public IPv4, disable redirects/proxies and pin DNS. IPv6-only targets and redirecting pages intentionally fail closed.

Historical CSV data and previous Git commits have NOT been purged. They require private preservation and history remediation; adding ignore rules does not withdraw previously published files. Rotate previously exposed credentials separately. These changes have syntax checks but still require an end-to-end application test before deployment.
