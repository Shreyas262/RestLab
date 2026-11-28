import { Code, Example, TopicLink } from "./prose";

export function ReadingResponses() {
  return (
    <>
      <p>
        Every response is shown the same way: a status line that states the
        outcome, then three tabs with the details.
      </p>

      <h2>The status line</h2>
      <p>
        The line above the tabs tells you what happened, in words, so you
        don&apos;t have to rely on colour:
      </p>
      <Example label="The four kinds of outcome">
        {`Success: 200 OK · 143 ms · 1.2 KB
HTTP error: 404 Not Found · 98 ms · 2 bytes
Request failed: The request timed out before a response arrived. (TIMEOUT)
Request cancelled.`}
      </Example>
      <p>
        An HTTP error is still a full response with headers and a body, and
        those often explain what went wrong. A failed request means no response
        arrived: the server couldn&apos;t be reached, the browser blocked the
        response, it took longer than 15 seconds, or it was larger than 5 MB.
      </p>

      <h2>Body</h2>
      <p>
        The Body tab is selected first and stays selected for later responses.
        It shows the body according to its type:
      </p>
      <ul>
        <li>
          <strong>JSON</strong> is indented and highlighted. Values appear
          exactly as received, so large numbers keep all their digits and
          repeated keys stay visible. JSON larger than 256 KB is shown as plain
          text, with a note.
        </li>
        <li>
          <strong>Text</strong>, such as HTML, XML, CSV, or SVG, is shown as
          text. It is never rendered as a page.
        </li>
        <li>
          <strong>Images</strong> such as PNG, JPEG, GIF, and WebP are shown as
          a preview.
        </li>
        <li>
          <strong>Other binary data</strong>, such as a PDF or an archive, is
          not displayed, but its type and size are in Metadata.
        </li>
      </ul>
      <p>
        If the server says a body is JSON but it isn&apos;t valid, you see the
        raw text and a processing error. Nothing that arrived is thrown away.
        The copy button copies the text as shown.
      </p>

      <h2>Overview</h2>
      <p>
        A one-line summary followed by the whole response as JSON: status,
        headers, body, timing, size, and how the request was sent. It&apos;s
        useful to copy everything at once, for example into a bug report. Image
        data is replaced by a short placeholder.
      </p>

      <h2>Metadata</h2>
      <p>
        Status, duration, size, content type, how the request was sent, and the
        response headers as a table. Size is the size of the body after
        decompression.
      </p>
      <p>
        When the request is sent from your browser, you only see the headers the
        server chooses to share. Others, and <Code>Set-Cookie</Code> always, are
        hidden by the browser.{" "}
        <TopicLink slug="strategies-and-cors">
          Execution strategies and CORS
        </TopicLink>{" "}
        explains why.
      </p>
    </>
  );
}
