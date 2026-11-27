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

### FR-03: Saved Request Templates

Users must be able to save their own requests as templates and send them again later (ADR-026).

- Save the current request (URL, method, parameters, headers, body, strategy) as a named template. Names are unique, ignoring case.
- List saved templates and load one into the editor. Everything stays editable after loading.
- Update a loaded template, save it as a new template, rename it, and delete it after a confirmation.
- Show when the editor differs from the loaded template.
- When saving, let the user choose between encrypting the template with a passphrase and saving it without encryption. Saving without encryption shows a warning that the data is stored as plain text (ADR-027).
- An encrypted template asks for its passphrase before it loads. It stays unlocked until the page reloads or the user locks it. A forgotten passphrase cannot be recovered.
- Templates are stored only in the user's browser. They are never sent to the server, and there is no account or sync.
- Damaged stored data, full storage, or a browser without storage must produce a clear message and must not break the rest of the application.

Predefined generic presets are not provided (ADR-026). Ready-made examples are part of FR-09.

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

The request in the editor is temporary: it is lost on reload unless the user saves it as a template (FR-03). No request history is kept. The stored values are saved templates in IndexedDB (ADR-026) and the theme preference cookie (ADR-018).

### FR-08: Theme

The application must offer light and dark themes with a visible toggle. The default follows the operating system preference. The user's choice persists across visits.

### FR-09: Guide and Public API Directory

The application must help first-time users without getting in the way of experienced ones (ADR-028).

- Guide pages that explain how to use RestLab: sending a first request, parameters, headers, and body, reading the response tabs, execution strategies and CORS, and saved templates with their storage and encryption limits.
- A directory of free public APIs. Each entry states what the API offers, its base URL, whether it needs a key, whether it works browser-direct, and the date it was last checked.
- Entries are not restricted to JSONPlaceholder or DummyJSON.
- Each entry has a "Try it" action that opens the playground with a sample request. The sample is fully editable and can be saved as a template.
- The guide is reachable from the main navigation and from the empty response area.

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
- Store request information only when the user saves a template, only in the user's browser, and offer passphrase encryption (ADR-026, ADR-027). Never send stored templates to the server.
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
7. User-saved request templates, optionally encrypted with a passphrase.
8. Guide pages and a public API directory with "Try it" examples.
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
- Predefined generic request presets (replaced by saved templates, ADR-026).
- Template import, export, and sync between browsers.
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

The public API directory (FR-09) adds further APIs, each checked against its current documentation.

External API availability, response behavior, and browser access policies are outside RestLab's direct control.

## 7. Constraints and Assumptions

- The application is browser-based.
- The initial release does not require user authentication.
- Request configurations are temporary unless the user saves them as templates.
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
- Users can save, load, update, rename, and delete their own templates, with or without passphrase encryption, and the templates survive a reload.
- Users can read the guide and run a public API example from the directory with "Try it".
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
