import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { RequestConfig } from "@/domain/request/schema";
import type { NormalizedResponse } from "@/domain/response/model";
import type { Executor } from "@/execution/contract/executor";
import type { ExecutionResult } from "@/execution/contract/result";
import { failureResult, responseResult } from "@/execution/contract/result";
import { makeRequest } from "@/test/fixtures/requests";
import { useExecution } from "./use-execution";

function makeResponse(status: number): NormalizedResponse {
  return {
    status,
    statusText: "",
    headers: [],
    durationMs: 5,
    sizeBytes: 0,
    contentType: null,
    bodyClass: "empty",
    strategy: "browser",
  };
}

/** An executor whose calls stay pending until the test settles them. */
function controllableExecutor() {
  const calls: {
    request: RequestConfig;
    signal: AbortSignal;
    settle: (result: ExecutionResult) => void;
  }[] = [];
  const executor = vi.fn<Executor>(
    (request, signal) =>
      new Promise<ExecutionResult>((resolve) => {
        calls.push({ request, signal, settle: resolve });
      }),
  );
  return { executor, calls };
}

describe("useExecution (FR-04, FR-07, NFR-04)", () => {
  test("starts idle", () => {
    const { executor } = controllableExecutor();
    const { result } = renderHook(() => useExecution(executor));

    expect(result.current.state).toEqual({ status: "idle" });
    expect(executor).not.toHaveBeenCalled();
  });

  test("moves from executing to completed with a response result", async () => {
    const { executor, calls } = controllableExecutor();
    const { result } = renderHook(() => useExecution(executor));
    const request = makeRequest();

    act(() => {
      void result.current.send(request);
    });
    expect(result.current.state).toEqual({ status: "executing" });
    expect(calls[0].request).toBe(request);
    expect(calls[0].signal.aborted).toBe(false);

    const response = responseResult(makeResponse(404));
    await act(async () => calls[0].settle(response));

    expect(result.current.state).toEqual({
      status: "completed",
      result: response,
    });
  });

  test.each(["NETWORK_ERROR", "TIMEOUT"] as const)(
    "completes with a %s failure instead of staying in loading",
    async (code) => {
      const { executor, calls } = controllableExecutor();
      const { result } = renderHook(() => useExecution(executor));

      act(() => {
        void result.current.send(makeRequest());
      });
      const failure = failureResult(code, "browser");
      await act(async () => calls[0].settle(failure));

      expect(result.current.state).toEqual({
        status: "completed",
        result: failure,
      });
    },
  );

  test("ignores a second send while executing", () => {
    const { executor } = controllableExecutor();
    const { result } = renderHook(() => useExecution(executor));

    act(() => {
      void result.current.send(makeRequest());
      void result.current.send(makeRequest());
    });

    expect(executor).toHaveBeenCalledTimes(1);
    expect(result.current.state).toEqual({ status: "executing" });
  });

  test("allows a new send after the previous one completed", async () => {
    const { executor, calls } = controllableExecutor();
    const { result } = renderHook(() => useExecution(executor));

    act(() => {
      void result.current.send(makeRequest());
    });
    await act(async () => calls[0].settle(responseResult(makeResponse(200))));
    act(() => {
      void result.current.send(makeRequest());
    });

    expect(executor).toHaveBeenCalledTimes(2);
    expect(result.current.state).toEqual({ status: "executing" });
  });

  test("cancel aborts the signal and completes with CANCELLED for the request's strategy", () => {
    const { executor, calls } = controllableExecutor();
    const { result } = renderHook(() => useExecution(executor));

    act(() => {
      void result.current.send(makeRequest({ strategy: "proxy" }));
    });
    act(() => result.current.cancel());

    expect(calls[0].signal.aborted).toBe(true);
    expect(result.current.state).toEqual({
      status: "completed",
      result: failureResult("CANCELLED", "proxy"),
    });
  });

  test("a result arriving after cancel does not overwrite the cancelled state", async () => {
    const { executor, calls } = controllableExecutor();
    const { result } = renderHook(() => useExecution(executor));

    act(() => {
      void result.current.send(makeRequest());
    });
    act(() => result.current.cancel());
    await act(async () => calls[0].settle(responseResult(makeResponse(200))));

    expect(result.current.state).toEqual({
      status: "completed",
      result: failureResult("CANCELLED", "browser"),
    });
  });

  test("a cancelled request's late result does not overwrite the next request", async () => {
    const { executor, calls } = controllableExecutor();
    const { result } = renderHook(() => useExecution(executor));

    act(() => {
      void result.current.send(makeRequest());
    });
    act(() => result.current.cancel());
    act(() => {
      void result.current.send(makeRequest());
    });
    await act(async () => calls[0].settle(responseResult(makeResponse(500))));

    expect(result.current.state).toEqual({ status: "executing" });

    const second = responseResult(makeResponse(200));
    await act(async () => calls[1].settle(second));

    expect(result.current.state).toEqual({
      status: "completed",
      result: second,
    });
  });

  test("cancel does nothing when no request is executing", () => {
    const { executor } = controllableExecutor();
    const { result } = renderHook(() => useExecution(executor));

    act(() => result.current.cancel());

    expect(result.current.state).toEqual({ status: "idle" });
  });

  test("unmount aborts the executing request without a state update", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { executor, calls } = controllableExecutor();
    const { result, unmount } = renderHook(() => useExecution(executor));

    act(() => {
      void result.current.send(makeRequest());
    });
    unmount();

    expect(calls[0].signal.aborted).toBe(true);

    await act(async () =>
      calls[0].settle(failureResult("CANCELLED", "browser")),
    );

    expect(result.current.state).toEqual({ status: "executing" });
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
