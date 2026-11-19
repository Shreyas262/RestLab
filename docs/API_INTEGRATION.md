# API Integration

**Status:** Draft v0.1 — 20 November 2026
**Depends on:** `SYSTEM_DESIGN.md`, `ARCHITECTURE.md`, `DECISIONS.md` (ADR-005 to ADR-009)

## 1. Purpose

This document specifies how RestLab turns a request configuration into an HTTP call and an HTTP response into the normalized response model. It covers request construction, response handling, the proxy contract, proxy security controls, and known constraints of external APIs.

Values marked **Proposed** are defaults to confirm during implementation. Anything not marked is derived from existing decisions.

## 2. Request Construction

Both executors build the call from the same validated request model. Differences between strategies are limited to where the call happens and what the platform allows.

### 2.1 URL and query parameters

- The URL field holds the base URL. Query parameters are managed separately and merged into the final URL at execution time.
- Parameters already present in the URL string are preserved. Duplicate keys are allowed, since many APIs accept repeated keys.
- Disabled or empty-key parameter rows are skipped.
- Keys and values are percent-encoded when the final URL is built.
- Only `http` and `https` are accepted. Any other scheme fails validation.

### 2.2 Methods and bodies

| Method | Body |
|---|---|
| GET | Not allowed. `fetch` rejects a GET with a body, so validation blocks it first. |
| POST, PUT, PATCH | Allowed (JSON or plain text). |
| DELETE | Open decision. `fetch` permits a body, but many servers ignore it. Default for the MVP: not sent. |

### 2.3 Headers

- Users add, edit, and remove headers as name/value rows. Names are validated as HTTP header tokens.
- The `Content-Type` header is derived from the body type (JSON: `application/json`, text: `text/plain`) unless the user sets one explicitly. A user-set value always wins.
- **Browser-direct:** browsers refuse to set certain "forbidden" request headers (for example `Host`, `Cookie`, `Origin`). Validation should warn when a configured header cannot be sent in this strategy rather than letting it fail silently. See MDN's "forbidden request header" list.
- **Proxy:** only headers the user configured are forwarded. Nothing is copied from the incoming request to RestLab itself (see §6.5).

### 2.4 JSON bodies

JSON bodies are checked with `JSON.parse` during validation so malformed JSON is reported before any network call. The body is sent as the user typed it, not re-serialized, to preserve formatting and ordering.

### 2.5 Caching

User-triggered requests must never reuse cached responses.

- Browser-direct: set `cache: "no-store"` on the call.
- Proxy: the Route Handler uses `POST`. Per the Next.js Route Handlers documentation, only `GET` handlers can be cached, so a `POST` handler is not cached. Still set `cache: "no-store"` explicitly on the upstream fetch so the behavior does not depend on defaults.

## 3. Execution and Timing

- Each execution creates one `AbortController` (ADR-010). The same signal handles user cancellation, superseded requests, and timeouts.
- **Timeout (Proposed):** 15 seconds in both strategies. A timeout is an execution error, not an HTTP response.
- **Duration** is measured from just before the call starts to just after the response body is fully read. It is computed with a monotonic clock (`performance.now`). In proxy mode, report the server-measured upstream duration. The round trip to the proxy is not included.
- **Redirects:**
  - Browser-direct: the browser follows redirects automatically and does not expose intermediate hops. The final response is what RestLab sees.
  - Proxy: redirects are handled manually and every hop is validated (§6.4).

## 4. Response Handling

### 4.1 Reading the body

The body is read once, as bytes, then decoded to text when the content type is textual. The raw text is preserved. Parsing happens afterwards from that text (ADR-007).

### 4.2 Normalized response fields

| Field | Source | Notes |
|---|---|---|
| Status | Response status | Always present when a response exists |
| Status text | Response status text | May be empty. HTTP/2 and HTTP/3 have no reason phrase, so display "not provided", not a blank |
| Headers | Response headers | Ordered list of name/value pairs. Browser-direct exposes only CORS-safelisted headers plus those the server lists in `Access-Control-Expose-Headers` |
| Duration | §3 | Milliseconds |
| Size | Bytes read | Size of the decoded body actually received. `Content-Length` is not used as the size, since it can describe compressed bytes or be missing. Where it cannot be measured, show "unavailable", never zero |
| Content type | `Content-Type` header | Stored as received, plus a derived classification |
| Raw body | §4.1 | Text, or absent for binary or empty bodies |
| Parsed body | Parsing step | Present only when parsing succeeds |
| Processing error | Parsing step | Present only when parsing or decoding fails |

### 4.3 Content-type classification

| Class | Matches | Body tab behavior |
|---|---|---|
| JSON | `application/json`, `+json` suffixes | Parse; format and highlight. On parse failure, show raw text and a processing error |
| Text | `text/*`, XML, and similar textual types | Show as plain text |
| Binary / other | Images, archives, unknown | Do not render. Show metadata and a "not displayed" message |
| Empty | Zero-length body | Show an explicit empty state |
| Missing type | No `Content-Type` | Treat as text if it decodes cleanly. Otherwise treat as binary |

HTML is text. It is displayed as text and never injected into the page (`ARCHITECTURE.md` §10).

### 4.4 Large responses

- Proxy: stop reading and fail with `RESPONSE_TOO_LARGE` once the size limit is exceeded (Proposed: 5 MB).
- Browser-direct: no hard limit is possible without reading the stream. Apply the same limit by counting bytes while reading, for consistent behavior.
- Display thresholds for highlighting are a separate pending decision.

## 5. Error Mapping

| Situation | Category | Result |
|---|---|---|
| Invalid URL, malformed JSON body, bad header name | Validation | No execution |
| DNS failure, connection refused, CORS block, offline | Execution | Failure |
| Timeout or user abort | Execution | Failure with a distinct reason |
| Upstream 4xx / 5xx | HTTP error | Response (status, headers, and body kept) |
| JSON parse failure, undecodable body | Response-processing | Response with a processing error |
| Proxy rejects destination, proxy internal error | Execution | Failure with a proxy reason |

**Browser CORS caveat.** When a browser blocks a response for CORS reasons, `fetch` rejects with a generic network error that does not say why. RestLab cannot distinguish a CORS block from an unreachable server in browser-direct mode. The UI may show a hint that CORS is a possible cause and that the proxy strategy might help. It must not switch strategies automatically (ADR-005).

## 6. Backend Proxy

### 6.1 Endpoint

- Route: `POST /api/execute`, implemented as a Route Handler under `src/app/api/execute/`.
- Accepts the request model as JSON. Responds with the envelope in §6.2.
- Uses the Web `Request` and `Response` APIs. Only `POST` is exported, so other methods receive `405`.

### 6.2 Envelope (Proposed, ADR-009)

The HTTP status of the proxy call describes the proxy, not the upstream API.

**Success.** HTTP 200. Body contains a flag marking success and the normalized response. This applies to every upstream status, including 404 and 500.

**Failure.** Body contains a flag marking failure and an error object with a category, a stable machine-readable code, and a user-safe message.

| Code | Meaning | Proxy HTTP status (Proposed) |
|---|---|---|
| `INVALID_REQUEST` | Body failed schema validation | 400 |
| `DESTINATION_BLOCKED` | Failed the destination policy | 403 |
| `UPSTREAM_TIMEOUT` | Timeout reached | 504 |
| `UPSTREAM_UNREACHABLE` | DNS, connection, or TLS failure | 502 |
| `RESPONSE_TOO_LARGE` | Size limit exceeded | 502 |
| `TOO_MANY_REDIRECTS` | Redirect limit exceeded | 502 |
| `INTERNAL_ERROR` | Unexpected proxy failure | 500 |

Messages must not reveal resolved IP addresses, internal hostnames, or stack traces. A blocked destination returns the same user-facing message regardless of why it was blocked.

The proxy executor on the client maps both shapes into the same `ExecutionResult` the browser executor returns. A non-JSON or malformed reply from `/api/execute` itself (for example a platform error page) is mapped to `INTERNAL_ERROR`.

### 6.3 Request validation on the server

The handler re-validates the incoming body with the shared Zod schema and enforces additional limits: maximum request body size and maximum header count and size (Proposed values to be set at implementation). Client-side validation is never trusted.

### 6.4 SSRF controls

Goal: the proxy must not be an unrestricted network relay (`SYSTEM_DESIGN.md` §5.3).

1. **Protocols.** Allow `http` and `https` only.
2. **Ports.** Restrict to a defined allowlist (Proposed: 80 and 443). Revisit if non-standard ports prove necessary.
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
7. **DNS rebinding.** Validating a name and then letting the HTTP client resolve it again leaves a gap. The connection should be made to the validated address. See the open decision in §8.
8. **Redirects.** Use manual redirect handling. Run the full validation again on every `Location` target. Limit hops (Proposed: 3).
9. **Limits.** Enforce the timeout (§3) and response-size limit (§4.4) in the proxy regardless of what the client sends.
10. **Logging.** Log destination host and outcome codes only. Never log header values or bodies.

### 6.5 Header and credential handling

- Forward only user-configured headers. Never forward headers from the incoming request to RestLab (cookies, `Authorization`, `Host`, forwarding headers).
- Strip hop-by-hop headers and anything that would alter connection semantics.
- Upstream `Set-Cookie` is returned only as data inside the envelope, so it has no effect on the RestLab origin.
- RestLab stores nothing about requests (no history or persistence in the MVP).
- Users may type credentials into header values. The proxy treats them as sensitive in transit and never writes them to logs.

### 6.6 Private and local APIs

The proxy blocks private and loopback destinations by design. A user who wants to call an API on `localhost` or an internal network must use browser-direct execution, subject to that API's CORS policy. The UI should explain this when the proxy rejects a destination.

### 6.7 Abuse and deployment considerations

Rate limiting, per-client quotas, and hosting-specific protections depend on where RestLab is deployed and are not yet specified. They must be decided before the proxy is publicly exposed.

## 7. Presets and Example APIs

- Presets are data conforming to the request model, in two groups: generic method-based templates and public API examples.
- Initial examples come from JSONPlaceholder (`https://jsonplaceholder.typicode.com/`) and DummyJSON (`https://dummyjson.com/`). Presets are not limited to these.
- A preset is a starting configuration. Loading one fills the editor and the user can change anything, including the execution strategy.
- Preset behavior must be confirmed against each service's current documentation when written, and again when problems are reported. JSONPlaceholder's documentation states that write requests are simulated and not persisted. Do not present a successful `POST` as proof of storage.
- Each preset should specify the preferred execution strategy only as a suggestion, since CORS behavior can change.
- External API availability and behavior are outside RestLab's control (`REQUIREMENTS.md` §6).

## 8. Open Decisions

| # | Decision | Notes |
|---|---|---|
| 1 | DELETE body | Send, or block in the MVP |
| 2 | Pinning the validated address | Native Node `fetch` may not expose a supported way to connect to a pre-validated address. This may require a custom connection layer, possibly an added dependency, which conflicts with ADR-011. Evaluate and record an ADR |
| 3 | Timeout, size, redirect, and port values | Confirm the Proposed values |
| 4 | Request body and header limits | Values to set |
| 5 | Rate limiting | Depends on deployment target |
| 6 | Binary response display | Metadata-only versus download or preview |
| 7 | Envelope field names | Finalize ADR-009 |

## 9. References

- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- MDN Fetch API and forbidden request headers
- OWASP guidance on Server-Side Request Forgery prevention
