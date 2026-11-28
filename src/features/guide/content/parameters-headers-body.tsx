import { Code, Example, TopicLink } from "./prose";

export function ParametersHeadersBody() {
  return (
    <>
      <p>
        Below the URL, three tabs hold the rest of the request: Params, Headers,
        and Body. The Final URL line under the request bar always shows the
        exact address that will be requested.
      </p>

      <h2>Query parameters</h2>
      <p>
        Each row on the Params tab is one parameter, with a name and a value.
        Use Add parameter for a new row and the checkbox to switch a row off
        without deleting it. Switched-off rows and rows without a name are
        skipped.
      </p>
      <p>
        You don&apos;t need to encode anything. Values are encoded for you, and
        parameters already in the URL are kept, with yours added after them.
      </p>
      <Example label="URL https://dummyjson.com/products/search, parameter q = phone case">
        Final URL: https://dummyjson.com/products/search?q=phone%20case
      </Example>

      <h2>Headers</h2>
      <p>
        The Headers tab works the same way. Common headers are{" "}
        <Code>Accept: application/json</Code>, to ask for JSON, and{" "}
        <Code>Authorization: Bearer &lt;token&gt;</Code>, for APIs that need a
        key.
      </p>
      <p>
        Browsers don&apos;t let web pages set some headers, such as{" "}
        <Code>Cookie</Code>, <Code>Host</Code>, <Code>Origin</Code>,{" "}
        <Code>Referer</Code>, and any name that starts with <Code>Sec-</Code> or{" "}
        <Code>Proxy-</Code>. RestLab warns you next to such a row, because the
        browser drops it without telling anyone.{" "}
        <TopicLink slug="strategies-and-cors">
          Execution strategies and CORS
        </TopicLink>{" "}
        explains why.
      </p>

      <h2>Body</h2>
      <p>
        Choose a body type on the Body tab: none, JSON, or text. JSON must be
        valid before the request can be sent, and the error points to the
        problem.
      </p>
      <Example label="A JSON body for POST https://httpbin.org/anything">
        {`{
  "title": "Hello",
  "done": false
}`}
      </Example>
      <p>
        RestLab adds a <Code>Content-Type</Code> header for you:{" "}
        <Code>application/json</Code> for JSON and <Code>text/plain</Code> for
        text. If you add your own <Code>Content-Type</Code> header, yours is
        sent instead.
      </p>
      <p>
        <Code>GET</Code> requests never have a body. When you switch to{" "}
        <Code>GET</Code>, the body editor is disabled but keeps what you typed,
        so switching back to <Code>POST</Code> brings it back. Every other
        method can send a body, and for <Code>DELETE</Code> it&apos;s optional.
      </p>

      <h2>Next</h2>
      <p>
        Send the request, then see{" "}
        <TopicLink slug="reading-responses">Read the response</TopicLink>.
      </p>
    </>
  );
}
