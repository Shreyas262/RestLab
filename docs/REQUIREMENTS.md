# RestLab — Requirements

**Status:** Accepted · **Last reviewed:** 2026-11-27

## 1. Purpose

This document defines the functional and non-functional requirements for RestLab.

It establishes the expected application behavior, MVP boundaries, constraints, and acceptance criteria.

## 2. Functional Requirements

### FR-01: Request Configuration

The application must allow users to configure HTTP requests.

Requirements:

- Enter and edit a request URL.
- Select an HTTP method.
- Configure query parameters.
- Add, edit, remove, enable, and disable query parameters.
- Configure request headers.
- Add, edit, remove, enable, and disable request headers.
- Configure request bodies for supported methods.
- Support no body, JSON, and plain-text request bodies.
- Validate required request configuration before execution.

Body rules per method are defined in `API_INTEGRATION.md` §2.2 (GET never sends a body; DELETE may send an optional body).

### FR-02: HTTP Method Support

The application must support:

- GET
- POST
- PUT
- PATCH
- DELETE

Each method must produce an appropriately configured HTTP request.

### FR-03: Request Presets

The application must provide predefined request configurations.

Two categories are required:

**Generic presets**

- Method-based default configurations.
- Reusable request templates.
- Configurations that users can customize for their APIs.

**Public API examples**

- Ready-to-execute example requests.
- Examples sourced from public APIs.
- Examples must not be restricted to JSONPlaceholder or DummyJSON.
- Users must be able to inspect and modify example configurations.

Presets must act as starting configurations rather than restricting customization.

### FR-04: Request Execution

The application must:

- Execute configured HTTP requests.
- Let the user choose the execution strategy: browser-direct or backend proxy. Browser-direct is the default.
- Never switch execution strategy automatically after a failure.
- Send configured query parameters and headers.
- Send request bodies where applicable.
- Display an appropriate loading state.
- Prevent accidental duplicate submissions while a request is executing.
- Let the user cancel a request that is executing.
- Stop waiting after a timeout and report it as an execution failure.
- Handle unsuccessful requests and network failures.
- Display the resulting response.

### FR-05: Response Inspection

The application must provide structured response information.

**Response metadata:**

- HTTP status code.
- HTTP status text.
- Response headers.
- Request execution duration.
- Response size.

**Response body:**

- Display formatted JSON responses.
- Provide syntax highlighting for JSON.
- Display plain-text responses.
- Preview common raster image responses (PNG, JPEG, GIF, WebP, AVIF, BMP, ICO).
- Display a meaningful fallback for unsupported content types.
- Provide a separate, easily identifiable response data view.
- Allow users to copy response content.

The complete response information and response body must be distinguishable in the interface.

### FR-06: Error Handling

The application must distinguish four outcome categories (ADR-008):

| Category            | Covers                                                          |
| ------------------- | --------------------------------------------------------------- |
| Validation          | Invalid request configuration, detected before any network call |
| Execution           | Network failures, timeouts, cancellation, proxy failures        |
| HTTP error response | Responses with a 4xx or 5xx status                              |
| Response-processing | Parsing failures and unexpected or unsupported response formats |

Error messages must be understandable and provide useful information without exposing sensitive internal details.

An HTTP error status must not automatically be treated as a network failure.

### FR-07: Application State

The application must provide appropriate states for:

- Initial state.
- Validation error.
- Request execution.
- Successful response.
- HTTP error response.
- Execution failure (network, timeout, proxy).
- Cancelled request.
- Response-processing failure.

Request configurations will remain temporary during the initial MVP.

No request history, saved requests, or persistent storage of request data is required. The only stored value is the user's theme preference, kept in a cookie (ADR-018).

### FR-08: Theme

The application must offer light and dark themes with a visible toggle. The default follows the operating system preference. The user's choice persists across visits.

## 3. Non-Functional Requirements

### NFR-01: Usability

- Provide an intuitive developer-focused interface.
- Minimize unnecessary configuration steps.
- Maintain clear visual separation between request and response sections.
- Make important response information easy to identify.

### NFR-02: Responsiveness

- Prioritize desktop layouts.
- Support tablet and mobile screen sizes.
- Maintain usability across supported display sizes.
- Avoid horizontal overflow and inaccessible controls.

### NFR-03: Performance

- Keep request configuration interactions responsive.
- Avoid unnecessary component rendering.
- Handle reasonably large API responses without unnecessarily blocking the interface.
- Display request execution feedback promptly.

Specific performance targets will be established during implementation and optimization.

### NFR-04: Reliability

- Handle unsuccessful HTTP responses.
- Handle network interruptions and timeouts.
- Handle empty responses.
- Handle invalid JSON.
- Handle unexpected content types.
- Avoid leaving the interface in a permanent loading state after failures.

### NFR-05: Security

- Validate and handle user-provided URLs safely.
- Avoid exposing sensitive information in error messages.
- Do not store request information.
- Protect the backend proxy against Server-Side Request Forgery and abuse (`API_INTEGRATION.md` §6).
- Prevent unsafe rendering of external response content.

### NFR-06: Accessibility

- Support keyboard navigation.
- Provide accessible labels for interactive controls.
- Maintain sufficient color contrast.
- Communicate loading and error states accessibly.
- Avoid relying exclusively on color to convey information.

### NFR-07: Maintainability

- Use TypeScript.
- Maintain clear separation of responsibilities.
- Avoid unnecessary dependencies and abstractions.
- Follow consistent coding conventions.
- Keep documentation synchronized with implementation.

## 4. MVP Scope

The initial MVP includes:

1. Request URL configuration.
2. HTTP method selection.
3. GET, POST, PUT, PATCH, DELETE support.
4. Query parameter management.
5. Request header management.
6. JSON and plain-text request bodies.
7. Generic request presets.
8. Public API example requests.
9. Custom request configuration.
10. Request execution with a user-selected strategy: browser-direct or backend proxy.
11. Request cancellation and timeout.
12. Response metadata inspection.
13. Response body formatting.
14. JSON syntax highlighting.
15. Response copying.
16. Loading, success, cancelled, and error states.
17. Basic response content-type handling.
18. Light and dark themes with a toggle.

## 5. Out of Scope for MVP

The following are deferred:

- Request history.
- Saved requests.
- Collections and folders.
- Authentication management.
- Environment variables.
- cURL import/export.
- Advanced response search and filtering.
- OpenAPI integration.
- User accounts.
- Cloud synchronization.
- Collaborative workspaces.

These features may be introduced in later development phases.

## 6. External API Dependencies

Initial development will use:

- JSONPlaceholder: https://jsonplaceholder.typicode.com/
- DummyJSON: https://dummyjson.com/

Additional public APIs may be used for reusable examples and testing.

External API availability, response behavior, and browser access policies are outside RestLab's direct control.

## 7. Constraints and Assumptions

- The application is browser-based.
- The initial release does not require user authentication.
- Request configurations are temporary.
- External APIs may impose CORS restrictions. In browser-direct mode a CORS block cannot be told apart from an unreachable server.
- Different APIs may require different request headers, payload structures, and authentication mechanisms.
- Response content types and response sizes may vary.
- Public APIs may become unavailable or change their behavior.

## 8. Acceptance Criteria

The MVP will be considered functionally complete when:

- Users can configure and execute all five supported HTTP methods.
- Users can choose browser-direct or proxy execution, and the strategy never changes on its own.
- The proxy blocks the destinations listed in `API_INTEGRATION.md` §6.4, verified by tests.
- Users can cancel an executing request.
- Users can manage query parameters and request headers.
- Users can submit JSON and plain-text request bodies.
- Users can use and customize generic presets.
- Users can execute public API examples.
- Users can inspect complete response metadata and response data separately.
- Users can identify HTTP errors and network failures.
- Users can copy response content.
- Loading and failure states behave correctly.
- The application remains usable across desktop, tablet, and mobile displays.
- Users can switch between light and dark themes, and the choice persists.
- The documented functional requirements pass their corresponding tests.

## 9. Requirement Evolution

Requirements may evolve as implementation reveals additional constraints.

Changes affecting product scope, architecture, or significant functionality must be reviewed and documented before implementation.

Future enhancements must not introduce unnecessary complexity into the initial MVP.
