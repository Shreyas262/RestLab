import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ImagePreview } from "./image-preview";

// jsdom has no object URLs, so the test supplies them.
const createObjectURL = vi.fn<(blob: Blob) => string>();
const revokeObjectURL = vi.fn<(url: string) => void>();

beforeEach(() => {
  let next = 0;
  createObjectURL.mockImplementation(() => `blob:test/${++next}`);
  Object.assign(URL, { createObjectURL, revokeObjectURL });
});

afterEach(() => {
  createObjectURL.mockReset();
  revokeObjectURL.mockReset();
});

const image = () =>
  screen.getByRole<HTMLImageElement>("img", { name: /Response image/ });

describe("ImagePreview (FR-05, NFR-05)", () => {
  test("shows the bytes through an object URL of the declared type", async () => {
    render(<ImagePreview base64="iVBORw==" mimeType="image/png" />);

    expect(image().src).toBe("blob:test/1");
    expect(image().alt).toBe("Response image (image/png)");
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe("image/png");
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(
      new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
    );
  });

  test("revokes the object URL on unmount", () => {
    const { unmount } = render(
      <ImagePreview base64="iVBORw==" mimeType="image/png" />,
    );

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test/1");
  });

  test("replaces and revokes the URL when the image changes", () => {
    const { rerender } = render(
      <ImagePreview base64="iVBORw==" mimeType="image/png" />,
    );
    rerender(<ImagePreview base64="R0lGOA==" mimeType="image/gif" />);

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test/1");
    expect(image().src).toBe("blob:test/2");
  });

  test("keeps one object URL across re-renders of the same image", () => {
    const { rerender } = render(
      <ImagePreview base64="iVBORw==" mimeType="image/png" />,
    );
    fireEvent.load(image());
    rerender(<ImagePreview base64="iVBORw==" mimeType="image/png" />);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  test("shows its size once loaded", () => {
    render(<ImagePreview base64="iVBORw==" mimeType="image/png" />);

    Object.defineProperties(image(), {
      naturalWidth: { value: 200 },
      naturalHeight: { value: 100 },
    });
    fireEvent.load(image());

    expect(screen.getByText("200 × 100 px")).toBeDefined();
  });

  test("explains when the bytes are not a valid image", () => {
    render(<ImagePreview base64="AAAA" mimeType="image/png" />);

    fireEvent.error(image());

    expect(
      screen.getByText(/could not be displayed as an image/),
    ).toBeDefined();
    expect(screen.queryByRole("img")).toBeNull();
  });

  test("does not carry a failure over to the next image", () => {
    const { rerender } = render(
      <ImagePreview base64="AAAA" mimeType="image/png" />,
    );
    fireEvent.error(image());
    rerender(<ImagePreview base64="iVBORw==" mimeType="image/png" />);

    expect(screen.queryByText(/could not be displayed/)).toBeNull();
    expect(image().hidden).toBe(false);
  });
});
