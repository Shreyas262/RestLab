# UI/UX Guidelines

**Status:** Accepted · **Last reviewed:** 2026-11-24

## 1. Design Direction

RestLab should have a clean, modern developer-tool aesthetic.

Design priorities:

- Minimal visual clutter.
- Clear information hierarchy.
- Consistent spacing and typography.
- Efficient request configuration.
- Readable response inspection.
- Responsive and accessible interactions.

## 2. Layout

### Desktop

Use a resizable split layout:

- Request editor on the left.
- Response inspector on the right.
- Adjustable divider between both sections.

Users should be able to allocate space according to their current task.

### Tablet and Mobile

Use a stacked layout instead of the desktop split.

Ensure controls and response content remain usable without horizontal overflow.

## 3. Request Editor

The request editor should contain:

- URL input.
- HTTP method selector.
- Send button, which becomes Cancel while a request is executing.
- Execution strategy selector (browser-direct or proxy; browser-direct by default). Added in M6 with the proxy (ADR-020).
- A read-only preview of the final URL, including enabled query parameters.
- Tabs for Params, Headers, and Body.

Support:

- Adding, editing, removing, enabling, and disabling query parameter rows.
- Adding, editing, removing, enabling, and disabling header rows.
- Choosing a body type (none, JSON, text) and editing body content. For GET the body editor is disabled and its content is kept but not sent (ADR-017).
- Clear validation feedback, shown next to the field it concerns.
- A warning on headers the browser will not send in browser-direct mode.
- Visible execution state.

### Strategy guidance

- After a browser-direct `NETWORK_ERROR`, show a hint that CORS may be the cause and that the proxy strategy might help. Never switch strategy automatically.
- After a proxy `DESTINATION_BLOCKED`, explain that private and local addresses can only be reached with browser-direct execution.

## 4. Response Inspector

Provide three tabs:

### Overview

A one-line summary (outcome, status, duration, size) followed by the complete normalized response as read-only, formatted JSON (`SYSTEM_DESIGN.md` §7.1).

### Body

The response body only. Formatted and highlighted JSON, plain text for textual types, an explicit empty state, and a "not displayed" message for binary content. Copy button for textual bodies.

### Metadata

A scannable view of status and status text, headers (as a table), duration, size (decoded body), content type, execution strategy, and execution outcome. In browser-direct mode, note that only CORS-exposed headers are visible.

The inspector must handle empty bodies, parsing failures, and unsupported content types gracefully. On a Failure result there is no response: show the failure state with its message instead of the tabs.

## 5. Visual Language

- Use shadcn/ui as the component foundation.
- Customize components to establish a consistent RestLab identity.
- Use monospaced typography for URLs, headers, JSON, and code-like content.
- Maintain consistent spacing, sizing, borders, and visual hierarchy.
- Avoid unnecessary decoration and excessive color.

### Theme

- Light and dark themes, both meeting the contrast requirements in §8.
- The default follows the operating system preference.
- A theme toggle is always visible in the page header. The user's choice is remembered in a cookie (ADR-018).
- The correct theme is applied before first paint, with no flash of the other theme.

## 6. Interaction and Feedback

Clearly communicate:

- Initial state.
- Loading state.
- Successful HTTP response.
- HTTP error response.
- Network or execution failure (with the failure reason).
- Cancelled request (neutral, not an error).
- Validation error.
- Response-processing error.

Prevent accidental duplicate submissions while execution is in progress.

Provide clear feedback for copy actions and other user interactions. Copy feedback is shown inline (for example the button briefly reads "Copied"), without a toast library.

## 7. Responsive Design

Support desktop, tablet, and mobile.

- Desktop: resizable side-by-side layout.
- Tablet: stacked layout with appropriately sized sections.
- Mobile: vertically stacked interface with accessible controls.
- Response content must not cause unintended page overflow.
- Wide JSON and headers should remain readable and navigable.

## 8. Accessibility

- Support keyboard navigation.
- Provide visible focus indicators.
- Use semantic HTML and accessible controls.
- Associate form fields with labels.
- Maintain sufficient color contrast.
- Communicate loading and execution states accessibly.
- Do not rely on color alone to communicate status.

## 9. Developer Experience

Optimize the interface for frequent API experimentation.

- Keep request execution controls easy to reach.
- Make response metadata easy to scan.
- Preserve readable formatting for structured data.
- Provide copy functionality where useful.
- Keep configuration and response inspection visually distinct.

## 10. Design Principles

1. Prioritize usability over decoration.
2. Keep frequently used actions accessible.
3. Maintain consistency across components.
4. Make application states explicit.
5. Design for realistic API responses, including large and malformed payloads.
6. Prefer responsive behavior over simply shrinking desktop components.
7. Avoid introducing interactions that do not provide meaningful value.
