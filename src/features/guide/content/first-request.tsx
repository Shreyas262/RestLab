import { sampleHref } from "../public-apis";
import { Code, Example, PageLink, TopicLink } from "./prose";

export function FirstRequest() {
  return (
    <>
      <p>
        RestLab sends one HTTP request at a time and shows you everything that
        comes back. You don&apos;t need an account, and nothing leaves your
        browser until you press Send.
      </p>

      <h2>1. Choose a method and enter a URL</h2>
      <p>
        Pick a method from the list next to the URL field: <Code>GET</Code>,{" "}
        <Code>POST</Code>, <Code>PUT</Code>, <Code>PATCH</Code>, or{" "}
        <Code>DELETE</Code>. <Code>GET</Code> reads data, and it&apos;s the
        right choice for most first requests.
      </p>
      <p>
        Then type the full address, including <Code>https://</Code>. Only{" "}
        <Code>http</Code> and <Code>https</Code> URLs are accepted, and a URL
        can&apos;t contain a username or password. Send those in an{" "}
        <Code>Authorization</Code> header instead.
      </p>
      <Example label="A request to try">
        GET https://jsonplaceholder.typicode.com/posts/1
      </Example>
      <p>
        Or skip the typing:{" "}
        <PageLink href={sampleHref("jsonplaceholder")}>
          open a JSONPlaceholder sample in the playground
        </PageLink>
        .
      </p>

      <h2>2. Press Send</h2>
      <p>
        While the request is running, Send turns into Cancel. A request that
        takes longer than 15 seconds is stopped and reported as a timeout.
      </p>
      <p>
        If something in the request is wrong, such as a missing URL or invalid
        JSON in the body, nothing is sent. The message appears next to the
        field, and the editor opens the tab that contains it.
      </p>

      <h2>3. Read the response</h2>
      <p>
        The response appears on the right, or below the editor on a narrow
        screen. A line at the top states the outcome in words:
      </p>
      <Example label="A successful response">
        Success: 200 OK · 143 ms · 292 bytes
      </Example>
      <p>
        A <Code>404</Code> or <Code>500</Code> is still a response. It&apos;s
        labelled as an HTTP error, and its headers and body are there to read.
        Only when no response arrives at all, for example because the server
        can&apos;t be reached, does RestLab report the request as failed.{" "}
        <TopicLink slug="reading-responses">Read the response</TopicLink>{" "}
        explains each tab.
      </p>

      <h2>Next steps</h2>
      <ul>
        <li>
          Add query parameters, headers, or a body:{" "}
          <TopicLink slug="parameters-headers-body">
            Parameters, headers, and body
          </TopicLink>
          .
        </li>
        <li>
          Pick an API to explore from the{" "}
          <PageLink href="/apis">Public APIs</PageLink> directory.
        </li>
        <li>
          Keep a request for later:{" "}
          <TopicLink slug="saved-templates">Saved templates</TopicLink>.
        </li>
      </ul>
    </>
  );
}
