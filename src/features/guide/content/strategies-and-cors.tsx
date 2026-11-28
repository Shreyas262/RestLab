import { Code, Example, PageLink, TopicLink } from "./prose";

export function StrategiesAndCors() {
  return (
    <>
      <p>
        An execution strategy is the route a request takes to the API. RestLab
        currently sends every request straight from your browser. This is called
        browser-direct.
      </p>

      <h2>Browser-direct</h2>
      <p>
        Your browser makes the request itself, from your network. That means it
        can reach APIs that only you can reach, such as a server running on{" "}
        <Code>localhost</Code> or on your company network.
      </p>
      <p>
        It also means the browser&apos;s security rules apply. Two of them
        matter here:
      </p>
      <ul>
        <li>
          Some headers can&apos;t be set by a web page, and the browser drops
          them silently. RestLab warns you about them on the Headers tab.
        </li>
        <li>
          The browser only lets RestLab read a response if the API allows it.
          This is CORS.
        </li>
      </ul>

      <h2>What CORS is</h2>
      <p>
        CORS, short for cross-origin resource sharing, is how an API tells
        browsers which websites may read its responses. The API answers with
        headers like this:
      </p>
      <Example label="A response header that allows every website">
        Access-Control-Allow-Origin: *
      </Example>
      <p>
        If the header is missing, or names a different website, the browser
        receives the response but keeps it from RestLab. Requests with a JSON
        body, a custom header, or a method other than <Code>GET</Code> and{" "}
        <Code>POST</Code> go through an extra check first: the browser sends an{" "}
        <Code>OPTIONS</Code> request and only continues if the API agrees.
      </p>
      <p>
        Even when a response is allowed, the browser shows only a few headers,
        plus those the API lists in <Code>Access-Control-Expose-Headers</Code>.
        That&apos;s why Metadata may show fewer headers than the API sent.
      </p>

      <h2>When a request fails with NETWORK_ERROR</h2>
      <p>
        The browser reports a CORS block in the same way as a server that
        can&apos;t be reached, on purpose, so RestLab can&apos;t tell them
        apart. When you see this failure, check in this order:
      </p>
      <ol>
        <li>
          Is the URL right, including <Code>http</Code> or <Code>https</Code>{" "}
          and the port?
        </li>
        <li>
          Is the server running? Try opening the URL in a new browser tab.
        </li>
        <li>
          Does the API allow browser requests? Its documentation usually says.
          The browser&apos;s developer tools console names CORS errors
          explicitly.
        </li>
      </ol>
      <p>
        If you control the API, allow RestLab&apos;s address in its CORS
        settings. Every entry in the{" "}
        <PageLink href="/apis">Public APIs</PageLink> directory allowed browser
        requests when it was last checked.
      </p>

      <h2>Through the RestLab server</h2>
      <p>
        A second strategy is planned but not available yet: sending the request
        from the RestLab server instead of your browser. CORS won&apos;t apply
        there, but the server can&apos;t reach <Code>localhost</Code> or private
        networks. RestLab will never switch strategy on its own after a failure;
        you&apos;ll always choose.
      </p>

      <h2>Related</h2>
      <p>
        <TopicLink slug="reading-responses">Read the response</TopicLink>{" "}
        describes the failure messages and the Metadata tab.
      </p>
    </>
  );
}
