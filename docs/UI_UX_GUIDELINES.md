# UI/UX Guidelines

**Status:** Accepted · **Last reviewed:** 2026-11-27

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

A saved-templates panel sits to the left of the request editor as a narrow, collapsible sidebar.

### Tablet and Mobile

Use a stacked layout instead of the desktop split. The saved-templates panel becomes a collapsible section above the request editor, collapsed by default.

Ensure controls and response content remain usable without horizontal overflow.

### Navigation

A slim header on every page holds the RestLab name and links to the Playground, the Guide, and the Public APIs directory (§11). The current page is marked with `aria-current="page"`.

## 3. Request Editor

The request editor should contain:

- URL input.
- HTTP method selector.
- Send button, which becomes Cancel while a request is executing.
- Save button next to Send (§3, Saved templates).
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

### Saved templates

Templates are the user's own saved requests (ADR-026). Behavior:

- **Save.** On a new request, Save opens a dialog that asks for a name and a storage choice. On a loaded template, Save updates it, and a "Save as new" action is next to it.
- **Storage choice** in the save dialog, with no default selected:
  - "Encrypt with a passphrase": passphrase and confirmation fields, at least 8 characters, and the note that a forgotten passphrase cannot be recovered and that the name stays readable.
  - "Save without encryption": the warning "Saved in this browser as plain text. Anyone or anything with access to this browser profile can read it, including tokens in headers."
- **List.** Most recently updated first. Each entry shows the name, the method, and a lock icon with a text label for encrypted templates. The loaded template is marked.
- **Load.** Selecting a plain template fills the editor at once. An encrypted, locked template asks for its passphrase first. A wrong passphrase shows "The passphrase is wrong, or the template data is damaged." next to the field. Loading never sends the request and does not clear the current response.
- **Modified.** When the editor differs from the loaded template, the template name shows a "Modified" marker in text, not only in color.
- **Lock.** An unlocked encrypted template offers a Lock action that forgets its key. A reload locks every template.
- **Rename and delete.** Rename edits the name in place. Delete asks for confirmation and names the template.
- **Errors.** Storage messages (unavailable, full, limit of 50, name taken, damaged records) appear in the panel next to the action that caused them. Damaged records are counted, with an action to delete them.
- Dialogs trap focus, close on Escape, and return focus to the control that opened them.

## 4. Response Inspector

Above the tabs, a short status line states the outcome in words (for example "Success: 200 OK · 12 ms · 1.2 KB", "HTTP error: 404 Not Found · …", "Request failed: … (TIMEOUT)", "Request cancelled."). Only this line is a live region, so a large body is never read aloud.

Provide three tabs. Body is selected first, and the selected tab is kept when a new response arrives:

### Overview

A one-line summary (outcome, status, duration, size) followed by the complete normalized response as read-only, formatted JSON (`SYSTEM_DESIGN.md` §7.1). `parsedBody` is left out, because it duplicates `rawBody` and stringifying it would lose digits (ADR-025); image data is replaced by a short placeholder. Copy button for the JSON.

### Body

The response body only. Formatted and highlighted JSON (plain text above 256 KB, with a note; ADR-023), plain text for textual types, a preview for raster images (ADR-024), an explicit empty state, and a "not displayed" message for other binary content. Copy button for textual bodies; it copies the text as shown (formatted JSON when formatted).

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

## 11. Guide and Public API Directory

Help for first-time users lives on its own pages, so the playground stays uncluttered (ADR-028).

- **Guide.** Short pages, each with one topic: sending a first request; parameters, headers, and body; reading the Overview, Body, and Metadata tabs; execution strategies and CORS; saved templates, storage, and encryption limits. Plain prose with short examples, a table of contents, and links between topics.
- **Public APIs directory.** One entry per API: name, what it offers, base URL, whether it needs a key, whether it works browser-direct, and when it was last checked. Each entry has a "Try it" link that opens the playground with the sample request in the editor. The sample is not sent automatically.
- **Entry point.** Before the first Send, the empty response area shows "New here? Read the guide or try a public API," linking to both pages.
- The pages follow the same theme, typography, and accessibility rules as the playground.
