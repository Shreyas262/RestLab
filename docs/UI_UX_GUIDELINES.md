# UI/UX Guidelines

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
- Send button.
- Execution strategy selector.
- Tabs for Params, Headers, and Body.

Support:

- Adding, editing, and removing query parameters.
- Adding, editing, and removing headers.
- Editing request body content.
- Clear validation feedback.
- Visible execution state.

## 4. Response Inspector

Provide three tabs:

### Overview

Consolidated normalized response information.

### Body

Formatted response content with syntax highlighting where supported.

### Metadata

Status, headers, duration, size, content type, and execution outcome.

The inspector must handle empty bodies, parsing failures, and unsupported content types gracefully.

## 5. Visual Language

- Use shadcn/ui as the component foundation.
- Customize components to establish a consistent RestLab identity.
- Use monospaced typography for URLs, headers, JSON, and code-like content.
- Maintain consistent spacing, sizing, borders, and visual hierarchy.
- Avoid unnecessary decoration and excessive color.

## 6. Interaction and Feedback

Clearly communicate:

- Initial state.
- Loading state.
- Successful HTTP response.
- HTTP error response.
- Network or execution failure.
- Validation error.
- Response-processing error.

Prevent accidental duplicate submissions while execution is in progress.

Provide clear feedback for copy actions and other user interactions.

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
