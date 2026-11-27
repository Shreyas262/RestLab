import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { makeRequest, row } from "@/test/fixtures/requests";
import { executeInBrowser } from "./browser-executor";
import { MAX_RESPONSE_BYTES, REQUEST_TIMEOUT_MS } from "./limits";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function respondWith(response: Response) {
  fetchMock.mockResolvedValue(response);
}

/** A fetch that never settles on its own and rejects like a real one when aborted. */
function hangUntilAborted() {
  fetchMock.mockImplementation(
    (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
      }),
  );
}

/** Headers arrive, then the body stalls until the request is aborted. */
function stallBodyUntilAborted() {
  fetchMock.mockImplementation((_input, init) => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("partial"));
        init?.signal?.addEventListener("abort", () =>
          controller.error(new DOMException("aborted", "AbortError")),
        );
      },
    });
    return Promise.resolve(new Response(body, { status: 200 }));
  });
}

function streamOf(...chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

describe("executeInBrowser (FR-04, FR-06, NFR-04)", () => {
  test("returns a normalized response for a 200", async () => {
    respondWith(
      new Response('{"id":1}', {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await executeInBrowser(
      makeRequest(),
      new AbortController().signal,
    );

    expect(result).toMatchObject({
      kind: "response",
      response: {
        status: 200,
        statusText: "OK",
        headers: [{ name: "content-type", value: "application/json" }],
        bodyClass: "json",
        rawBody: '{"id":1}',
        parsedBody: { id: 1 },
        strategy: "browser",
      },
    });
  });

  test.each([404, 500])(
    "returns HTTP %i as a response with its body, not a failure",
    async (status) => {
      respondWith(
        new Response("nope", {
          status,
          headers: { "Content-Type": "text/plain" },
        }),
      );

      const result = await executeInBrowser(
        makeRequest(),
        new AbortController().signal,
      );

      expect(result).toMatchObject({
        kind: "response",
        response: { status, rawBody: "nope", bodyClass: "text" },
      });
    },
  );

  test("sends the prepared request with cache: no-store", async () => {
    respondWith(new Response(null, { status: 204 }));

    await executeInBrowser(
      makeRequest({
        method: "POST",
        url: "https://api.example.com/items",
        params: [row("page", "2")],
        headers: [row("X-Trace", "abc")],
        body: { type: "json", content: '{"a":1}' },
      }),
      new AbortController().signal,
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.example.com/items?page=2");
    expect(init).toMatchObject({
      method: "POST",
      cache: "no-store",
      body: '{"a":1}',
      headers: [
        ["X-Trace", "abc"],
        ["Content-Type", "application/json"],
      ],
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  test("returns an empty body for a response without one", async () => {
    respondWith(new Response(null, { status: 204 }));

    const result = await executeInBrowser(
      makeRequest(),
      new AbortController().signal,
    );

    expect(result).toMatchObject({
      kind: "response",
      response: { status: 204, sizeBytes: 0, bodyClass: "empty" },
    });
  });

  test("reads the body exactly once", async () => {
    const response = new Response("hello", { status: 200 });
    const getReader = vi.spyOn(response.body!, "getReader");
    const text = vi.spyOn(response, "text");
    const arrayBuffer = vi.spyOn(response, "arrayBuffer");
    respondWith(response);

    await executeInBrowser(makeRequest(), new AbortController().signal);

    expect(getReader).toHaveBeenCalledOnce();
    expect(text).not.toHaveBeenCalled();
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  test("reports the bytes read as the size, ignoring Content-Length", async () => {
    const encoder = new TextEncoder();
    respondWith(
      new Response(streamOf(encoder.encode("abc"), encoder.encode("de")), {
        status: 200,
        headers: { "Content-Length": "999" },
      }),
    );

    const result = await executeInBrowser(
      makeRequest(),
      new AbortController().signal,
    );

    expect(result.kind === "response" && result.response.sizeBytes).toBe(5);
  });

  test("accepts a body of exactly the size limit", async () => {
    respondWith(
      new Response(streamOf(new Uint8Array(MAX_RESPONSE_BYTES)), {
        status: 200,
      }),
    );

    const result = await executeInBrowser(
      makeRequest(),
      new AbortController().signal,
    );

    expect(result.kind).toBe("response");
  });

  test("fails with RESPONSE_TOO_LARGE once the limit is exceeded", async () => {
    respondWith(
      new Response(
        streamOf(new Uint8Array(MAX_RESPONSE_BYTES), new Uint8Array(1)),
        { status: 200 },
      ),
    );

    const result = await executeInBrowser(
      makeRequest(),
      new AbortController().signal,
    );

    expect(result).toMatchObject({
      kind: "failure",
      failure: { code: "RESPONSE_TOO_LARGE" },
      strategy: "browser",
    });
  });

  test("maps a fetch rejection to NETWORK_ERROR", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await executeInBrowser(
      makeRequest(),
      new AbortController().signal,
    );

    expect(result).toMatchObject({
      kind: "failure",
      failure: { code: "NETWORK_ERROR" },
      strategy: "browser",
    });
  });

  test("maps a body read error to NETWORK_ERROR", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new TypeError("network lost"));
      },
    });
    respondWith(new Response(body, { status: 200 }));

    const result = await executeInBrowser(
      makeRequest(),
      new AbortController().signal,
    );

    expect(result).toMatchObject({
      kind: "failure",
      failure: { code: "NETWORK_ERROR" },
    });
  });

  test("fails with TIMEOUT when no response arrives in time", async () => {
    vi.useFakeTimers();
    hangUntilAborted();

    const pending = executeInBrowser(
      makeRequest(),
      new AbortController().signal,
    );
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);

    expect(await pending).toMatchObject({
      kind: "failure",
      failure: { code: "TIMEOUT" },
      strategy: "browser",
    });
  });

  test("fails with TIMEOUT when the body stalls past the limit", async () => {
    vi.useFakeTimers();
    stallBodyUntilAborted();

    const pending = executeInBrowser(
      makeRequest(),
      new AbortController().signal,
    );
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);

    expect(await pending).toMatchObject({
      kind: "failure",
      failure: { code: "TIMEOUT" },
    });
  });

  test("does not time out just before the limit", async () => {
    vi.useFakeTimers();
    hangUntilAborted();
    const controller = new AbortController();

    const pending = executeInBrowser(makeRequest(), controller.signal);
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS - 1);
    controller.abort();

    expect(await pending).toMatchObject({ failure: { code: "CANCELLED" } });
  });

  test("fails with CANCELLED when the caller aborts while waiting", async () => {
    hangUntilAborted();
    const controller = new AbortController();

    const pending = executeInBrowser(makeRequest(), controller.signal);
    controller.abort();

    expect(await pending).toMatchObject({
      kind: "failure",
      failure: { code: "CANCELLED" },
      strategy: "browser",
    });
  });

  test("fails with CANCELLED when the caller aborts during the body read", async () => {
    stallBodyUntilAborted();
    const controller = new AbortController();

    const pending = executeInBrowser(makeRequest(), controller.signal);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    controller.abort();

    expect(await pending).toMatchObject({ failure: { code: "CANCELLED" } });
  });

  test("returns CANCELLED without calling fetch when already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    const result = await executeInBrowser(makeRequest(), controller.signal);

    expect(result).toMatchObject({ failure: { code: "CANCELLED" } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("stops listening to the caller's signal after finishing", async () => {
    respondWith(new Response("ok", { status: 200 }));
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, "removeEventListener");

    await executeInBrowser(makeRequest(), controller.signal);

    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
  });
});
