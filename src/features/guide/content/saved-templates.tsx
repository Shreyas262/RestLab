import { Code, Example, TopicLink } from "./prose";

export function SavedTemplates() {
  return (
    <>
      <p>
        A template is a request you saved: the URL, method, parameters, headers,
        and body. Templates are listed in the Saved templates panel, next to the
        editor on a wide screen and above it on a narrow one.
      </p>

      <h2>Save a request</h2>
      <p>
        Press Save next to Send. Saving never sends the request, and you can
        save one that isn&apos;t finished yet. Give it a name and choose how to
        store it:
      </p>
      <ul>
        <li>
          <strong>Encrypt with a passphrase.</strong> The request is encrypted
          before it is stored. The passphrase needs at least 8 characters.
        </li>
        <li>
          <strong>Save without encryption.</strong> The request is stored as
          plain text. Anyone or anything with access to this browser profile can
          read it, including tokens in headers.
        </li>
      </ul>
      <p>
        If a request contains a key or token, encrypt it. You can save up to 50
        templates.
      </p>

      <h2>Load, change, and save again</h2>
      <p>
        Select a template to load it into the editor. Loading doesn&apos;t send
        the request and doesn&apos;t clear the current response. The line under
        the request bar names the loaded template and adds “Modified” once you
        change something.
      </p>
      <Example label="The loaded template line after an edit">
        Template: Users list · Modified
      </Example>
      <p>
        Save then updates that template. Save as new keeps the original and
        creates a copy. Each entry in the list also has Rename and Delete.
        Delete asks you to confirm, and can&apos;t be undone.
      </p>

      <h2>Encrypted templates</h2>
      <p>
        An encrypted template shows a lock and asks for its passphrase when you
        select it. Once unlocked, it stays unlocked until you press its Lock
        button or reload the page. A reload locks every template.
      </p>
      <p>
        Encryption happens in your browser with the Web Crypto API. Each
        template gets its own key, derived from your passphrase with PBKDF2
        (SHA-256, 600,000 iterations), and is encrypted with AES-GCM. That makes
        unlocking take a moment, on purpose, so passphrases are slow to guess.
      </p>

      <h2>What encryption protects, and what it doesn&apos;t</h2>
      <ul>
        <li>
          It protects a locked template from other people using this device, a
          copy of the browser profile, and other code running in the page.
        </li>
        <li>
          It doesn&apos;t protect a template while it&apos;s unlocked, because
          the request is then in the editor.
        </li>
        <li>
          The template&apos;s name and the times it was created and updated are
          not encrypted, so the list can show them. Don&apos;t put secrets in
          the name.
        </li>
        <li>
          A forgotten passphrase can&apos;t be recovered, not even by RestLab.
          The template can only be deleted.
        </li>
      </ul>

      <h2>Where templates are stored</h2>
      <p>
        Only in this browser, in its IndexedDB storage. They are never sent to a
        server and don&apos;t sync to other browsers or devices. Clearing the
        site data for RestLab deletes them. In a private window, the browser may
        block storage or delete it when the window closes, and RestLab tells you
        if storage is unavailable.
      </p>
      <p>
        RestLab keeps nothing else about your requests. There is no request
        history, and request data is never stored in cookies or{" "}
        <Code>localStorage</Code>.
      </p>

      <h2>Related</h2>
      <p>
        <TopicLink slug="first-request">Send your first request</TopicLink>{" "}
        covers building a request to save.
      </p>
    </>
  );
}
