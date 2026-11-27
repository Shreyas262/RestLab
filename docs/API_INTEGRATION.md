# API Integration

**Status:** Accepted, with values marked Proposed still to confirm · **Last reviewed:** 2026-11-27
**Depends on:** `SYSTEM_DESIGN.md`, `ARCHITECTURE.md`, `DECISIONS.md`

## 1. Purpose

This document specifies how RestLab turns a request configuration into an HTTP call and an HTTP response into the normalized response model. It covers request construction, response handling, failure codes, the proxy contract, proxy security controls, and known constraints of external APIs.

Values marked **Proposed** are defaults to confirm in the milestone named in the open-decisions register (`DECISIONS.md` §5). Everything else is settled.

## 2. Request Construction

Both executors build the call from the same validated request model. Differences between strategies are limited to where the call happens and what the platform allows.

### 2.1 URL and query parameters

- The URL field holds the base URL. Query parameters are managed as rows (key, value, enabled) and merged into the final URL at execution time.
- Parameters already present in the URL string are preserved. Duplicate keys are allowed, since many APIs accept repeated keys.
- Disabled rows and rows with an empty key are skipped.
- Keys and values are percent-encoded with `encodeURIComponent` when the final URL is built, so a space becomes `%20`, not `+`. New parameters are appended after any existing query string, which is kept as written.
- Only `http` and `https` are accepted. Any other scheme fails validation.
- URLs containing credentials (`user:password@host`) fail validation in both strategies. Browser `fetch` rejects them, and the proxy must not forward them.
- The editor shows the final URL, read-only, so the user can see exactly what will be called.

### 2.2 Methods and bodies

The body has a type: `none`, `json`, or `text`.

| Method           | Body                                                                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET              | Never sent. `fetch` rejects a GET with a body. The body editor is disabled; text typed earlier is kept in the editor but not sent, so switching methods loses nothing. |
| POST, PUT, PATCH | Optional (`none`, `json`, or `text`).                                                                                                                                  |
| DELETE           | Optional (`none`, `json`, or `text`). Some servers ignore a DELETE body; that is the server's choice (ADR-017).                                                        |

### 2.3 Headers

- Users add, edit, remove, enable, and disable headers as rows. Names are trimmed and validated as HTTP header tokens (RFC 9110 §5.6.2). Values must not contain CR, LF, or NUL, which Fetch rejects. Disabled rows and rows with an empty name are skipped.
- When a body is sent, `Content-Type` is derived from the body type (`json`: `application/json`, `text`: `text/plain`) unless the user sets one explicitly. A user-set value always wins.
- **Browser-direct:** browsers refuse to set certain "forbidden" request headers (for example `Host`, `Cookie`, `Origin`). Validation warns when a configured header cannot be sent in this strategy rather than letting it fail silently. See MDN's "forbidden request header" list.
- **Proxy:** only headers the user configured are forwarded. Nothing is copied from the incoming request to RestLab itself (§6.5).

### 2.4 JSON bodies

JSON bodies are checked with `JSON.parse` during validation so malformed JSON is reported before any network call. The body is sent as the user typed it, not re-serialized, to preserve formatting and ordering.

### 2.5 Caching

User-triggered requests must never reuse cached responses.

- Browser-direct: set `cache: "no-store"` on the call.
- Proxy: the Route Handler exports only `POST`, and non-`GET` Route Handlers are never cached (Next.js 16.4 Route Handlers docs). The upstream request is made fresh on every call and is not routed through any cache.

## 3. Execution and Timing

- Each execution creates one `AbortController` (ADR-010). Its signal is combined with a timeout signal, so one signal covers cancellation, unmount, and timeout. The failure code records which one fired (§5).
- **Timeout:** 15 seconds in both strategies (OD-3, decided 2026-11-26). A timeout is an execution failure, not an HTTP response.
- **Duration** is measured with `performance.now()` from just before the call starts to just after the response body is fully read. In proxy mode, the server-measured upstream duration is reported; the round trip to the proxy is not included. The Metadata tab labels which one is shown.
- **Redirects:**
  - Browser-direct: the browser follows redirects automatically and does not expose intermediate hops. The final response is what RestLab sees.
  - Proxy: redirects are handled manually and every hop is validated (§6.4).

## 4. Response Handling

### 4.1 Reading the body

The body is read once, as bytes, counting bytes as they arrive so the size limit (§4.4) can stop the read. The bytes are then decoded to text with `TextDecoder` when the content is textual, using the charset from `Content-Type` (default UTF-8). Byte sequences that are invalid in that charset are replaced with U+FFFD, so one bad byte does not hide a readable body. An unknown charset label gives a `DECODE_ERROR` processing error and no raw text. The raw text is preserved. Parsing happens afterwards from that text (ADR-007).

### 4.2 Normalized response fields

| Field            | Source               | Notes                                                                                                                                                                                                                                                                                                                                   |
| ---------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status           | Response status      | Always present when a response exists                                                                                                                                                                                                                                                                                                   |
| Status text      | Response status text | May be empty. HTTP/2 and HTTP/3 have no reason phrase, so display "not provided", not a blank                                                                                                                                                                                                                                           |
| Headers          | Response headers     | List of name/value pairs as Fetch exposes them: names lowercased and sorted, repeated headers combined with `, `. On the server, `Set-Cookie` values are read with `getSetCookie()` and listed one per entry. Browser-direct exposes only CORS-safelisted headers plus those in `Access-Control-Expose-Headers`, and never `Set-Cookie` |
| Duration         | §3                   | Milliseconds                                                                                                                                                                                                                                                                                                                            |
| Size             | Bytes read           | Decoded body bytes actually received (ADR-014). `Content-Length` is not used, since it can describe compressed bytes or be missing. Zero only for a genuinely empty body                                                                                                                                                                |
| Content type     | `Content-Type`       | Stored as received, plus a derived classification                                                                                                                                                                                                                                                                                       |
| Raw body         | §4.1                 | Text, or absent for image, binary, or empty bodies                                                                                                                                                                                                                                                                                      |
| Parsed body      | Parsing step         | Present only when parsing succeeds                                                                                                                                                                                                                                                                                                      |
| Processing error | Parsing step         | Present only when parsing or decoding fails                                                                                                                                                                                                                                                                                             |
| Strategy         | Executor             | `browser` or `proxy`, for display only                                                                                                                                                                                                                                                                                                  |

### 4.3 Content-type classification

| Class          | Matches                                                                           | Body tab behavior                                                                        |
| -------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| JSON           | `application/json`, `+json` suffixes                                              | Parse; format and highlight. On parse failure, show raw text and a processing error      |
| Text           | `text/*`, XML, and similar textual types                                          | Show as plain text                                                                       |
| Image          | `image/png`, `jpeg`, `gif`, `webp`, `avif`, `bmp`, `x-icon`, `vnd.microsoft.icon` | Keep the bytes as base64 and show them as an image (ADR-024). SVG is text                |
| Binary / other | Archives, other images, unknown                                                   | Do not render. Show metadata and a "not displayed" message                               |
| Empty          | Zero-length body                                                                  | Show an explicit empty state                                                             |
| Missing type   | No `Content-Type`                                                                 | Treat as text if it decodes cleanly (`TextDecoder` with `fatal: true`). Otherwise binary |

HTML is text. It is displayed as text and never injected into the page (`ARCHITECTURE.md` §10).

### 4.4 Large responses

- Both strategies stop reading and return a `RESPONSE_TOO_LARGE` failure once the size limit of 5 MB (5 × 1024 × 1024 bytes; OD-3, decided 2026-11-26) is exceeded. The proxy enforces it regardless of what the client sends.
- The display limit is separate: JSON above 256 KB is shown as plain text without formatting or highlighting (ADR-023).

## 5. Failure Codes and Error Mapping

Every Failure result carries one code from this shared set. Both executors use the same codes, so the UI handles them in one place.

| Code                   | Meaning                                                            | Produced by                                     |
| ---------------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| `NETWORK_ERROR`        | `fetch` rejected without a response (offline, DNS, refused, CORS)  | Browser, proxy executor reaching `/api/execute` |
| `TIMEOUT`              | The timeout fired                                                  | Browser, proxy                                  |
| `CANCELLED`            | The user cancelled, or the view unmounted                          | Browser, proxy executor                         |
| `RESPONSE_TOO_LARGE`   | Size limit exceeded while reading                                  | Browser, proxy                                  |
| `INVALID_REQUEST`      | Proxy request failed schema, content-type, or size checks          | Proxy                                           |
| `FORBIDDEN_ORIGIN`     | Proxy called from another site                                     | Proxy                                           |
| `DESTINATION_BLOCKED`  | Destination failed the SSRF policy                                 | Proxy                                           |
| `UPSTREAM_UNREACHABLE` | DNS, connection, or TLS failure upstream                           | Proxy                                           |
| `TOO_MANY_REDIRECTS`   | Redirect limit exceeded                                            | Proxy                                           |
| `INTERNAL_ERROR`       | Unexpected proxy failure, or a malformed reply from `/api/execute` | Proxy, proxy executor                           |

`CANCELLED` is shown as a neutral "Request cancelled" state, not as an error.

| Situation                                         | Category            | Result                                    |
| ------------------------------------------------- | ------------------- | ----------------------------------------- |
| Invalid URL, malformed JSON body, bad header name | Validation          | No execution                              |
| Any failure code above                            | Execution           | Failure                                   |
| Upstream 4xx / 5xx                                | HTTP error          | Response (status, headers, and body kept) |
| JSON parse failure, undecodable body              | Response-processing | Response with a processing error          |

**Browser CORS caveat.** When a browser blocks a response for CORS reasons, `fetch` rejects with a generic network error that does not say why. RestLab cannot distinguish a CORS block from an unreachable server in browser-direct mode, so both become `NETWORK_ERROR`. The UI shows a hint that CORS is a possible cause and that the proxy strategy might help. It must not switch strategies automatically (ADR-005).

## 6. Backend Proxy

### 6.1 Endpoint

- Route: `POST /api/execute`, implemented as a Route Handler at `src/app/api/execute/route.ts`, on the Node.js runtime.
- Accepts the request model as JSON. Responds with the envelope in §6.2.
- Uses the Web `Request` and `Response` APIs. Only `POST` is exported, so other methods receive `405`.

### 6.2 Envelope (ADR-009)

The HTTP status of the proxy call describes the proxy, not the upstream API.

**Success.** HTTP 200. Body is `{ "ok": true, "response": NormalizedResponse }`. This applies to every upstream status, including 404 and 500.

**Failure.** Body is `{ "ok": false, "error": { "code": FailureCode, "message": string } }`, with a failure code from §5 and a user-safe message.

The types are `ProxyEnvelope` and `PROXY_FAILURE_STATUS` in `src/execution/contract/envelope.ts`. `NETWORK_ERROR` and `CANCELLED` arise only in the client; the proxy never sends them, and they map to 500 if it does.

| Code                   | Proxy HTTP status (Proposed)         |
| ---------------------- | ------------------------------------ |
| `INVALID_REQUEST`      | 400, or 415 for a wrong content type |
| `FORBIDDEN_ORIGIN`     | 403                                  |
| `DESTINATION_BLOCKED`  | 403                                  |
| `TIMEOUT`              | 504                                  |
| `UPSTREAM_UNREACHABLE` | 502                                  |
| `RESPONSE_TOO_LARGE`   | 502                                  |
| `TOO_MANY_REDIRECTS`   | 502                                  |
| `INTERNAL_ERROR`       | 500                                  |

Messages must not reveal resolved IP addresses, internal hostnames, or stack traces. A blocked destination returns the same user-facing message regardless of why it was blocked.

The proxy executor on the client maps both shapes into the same `ExecutionResult` the browser executor returns. A non-JSON or malformed reply from `/api/execute` itself (for example a platform error page) is mapped to `INTERNAL_ERROR`.

### 6.3 Incoming request checks

In order, before any upstream work:

1. **Content type (Proposed).** Require `Content-Type: application/json`; otherwise `INVALID_REQUEST` (415). This forces a CORS preflight for cross-origin callers, which the endpoint does not answer.
2. **Origin (Proposed).** Reject requests whose `Sec-Fetch-Site` header is present and not `same-origin`, or whose `Origin` header is present and does not match the RestLab origin (`FORBIDDEN_ORIGIN`). This stops other websites from driving the proxy through visitors' browsers. It is not a substitute for rate limiting.
3. **Size limits (Proposed values set in M6).** Maximum request body size, header count, and header size.
4. **Schema.** Re-validate with the shared Zod schema (ADR-006). Client-side validation is never trusted.

### 6.4 SSRF controls

Goal: the proxy must not be an unrestricted network relay (`SYSTEM_DESIGN.md` §5.3).

1. **Protocols.** Allow `http` and `https` only.
2. **Ports.** Restrict to an allowlist (Proposed: 80 and 443). Revisit if non-standard ports prove necessary.
3. **Credentials in URLs.** Reject `user:password@host` forms.
4. **Resolve, then validate.** Resolve the hostname server-side and check every returned address, IPv4 and IPv6, against the blocked ranges below.
5. **Blocked ranges.**
   - Loopback: `127.0.0.0/8`, `::1`
   - Private: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`
   - Link-local: `169.254.0.0/16`, `fe80::/10`. This includes the cloud metadata address `169.254.169.254`.
   - Unspecified and "this network": `0.0.0.0/8`, `::`
   - Carrier-grade NAT: `100.64.0.0/10`
   - Multicast and reserved ranges
   - IPv4-mapped IPv6 forms, which must be checked as their IPv4 equivalents
   - Known metadata hostnames
6. **Bypass forms.** Normalize hosts before checking so decimal, octal, hex, and shortened IPv4 notations cannot evade the rules. Prefer parsing to an address and checking the address over matching strings.
7. **DNS rebinding.** Validating a name and then letting the HTTP client resolve it again leaves a gap. The connection must be made to the validated address. Candidate approaches (decided in the M6 spike, open item OD-2):
   - `node:https` / `node:http` `request` with a custom `lookup` function that validates each resolved address at connection time. No new dependency, but the upstream call is not Fetch, which amends ADR-011.
   - An `undici` `Agent` with a custom `connect.lookup`, passed to `fetch` as the dispatcher. Keeps Fetch, but adds a dependency.
8. **Redirects.** Manual redirect handling. Run the full validation again on every `Location` target. Limit hops (Proposed: 3).
9. **Limits.** Enforce the timeout (§3) and response-size limit (§4.4) in the proxy regardless of what the client sends.
10. **Logging.** Log destination host and failure codes only. Never log header values or bodies.

### 6.5 Header and credential handling

- Forward only user-configured headers. Never forward headers from the incoming request to RestLab (cookies, `Authorization`, `Host`, forwarding headers).
- Strip hop-by-hop headers and anything that would alter connection semantics.
- Upstream `Set-Cookie` is returned only as data inside the envelope, so it has no effect on the RestLab origin.
- The proxy stores nothing about requests. Saved templates live only in the user's browser (ADR-026) and are never sent to the server. The proxy sees a template's request only when the user sends it.
- Users may type credentials into header values. The proxy treats them as sensitive in transit and never writes them to logs.

### 6.6 Private and local APIs

The proxy blocks private and loopback destinations by design. A user who wants to call an API on `localhost` or an internal network must use browser-direct execution, subject to that API's CORS policy. The UI explains this when the proxy returns `DESTINATION_BLOCKED`.

### 6.7 Abuse and deployment considerations

Rate limiting, per-client quotas, and hosting-specific protections depend on where RestLab is deployed (open item OD-9). They must be decided and in place before the proxy is publicly exposed.

## 7. Public API Directory and Samples

- There are no predefined generic presets (ADR-026). Users save their own templates (`REQUIREMENTS.md` FR-03).
- The public API directory (FR-09, ADR-028) lists free APIs, starting with JSONPlaceholder (`https://jsonplaceholder.typicode.com/`) and DummyJSON (`https://dummyjson.com/`) but not limited to them. Each "Try it" sample is data that passes `requestSchema`.
- Samples are chosen to work browser-direct, so they need APIs that allow cross-origin requests and need no key.
- A sample is a starting configuration. "Try it" fills the editor and the user can change anything, including the execution strategy.
- Each entry must be confirmed against the service's current documentation when written, and again when problems are reported. The directory shows the date of the last check. JSONPlaceholder's documentation states that write requests are simulated and not persisted. Do not present a successful `POST` as proof of storage.
- External API availability and behavior are outside RestLab's control (`REQUIREMENTS.md` §6).

## 8. Open Decisions

Tracked in one place: `DECISIONS.md` §5 (OD-2 to OD-5 and OD-9 concern this document; OD-1 is resolved).

## 9. References

- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers (bundled copy: `node_modules/next/dist/docs/01-app/01-getting-started/`)
- MDN Fetch API and forbidden request headers
- MDN `Sec-Fetch-Site`
- Node.js `http.request` options (`lookup`)
- OWASP guidance on Server-Side Request Forgery prevention
