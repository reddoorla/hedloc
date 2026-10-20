import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import { tick } from "svelte";
import type { ImageFieldImage } from "@prismicio/client";
import Img from "./Img.svelte";

afterEach(() => cleanup());

// Minimal filled Prismic image field — enough for PrismicImage to render its
// <img>.
const field = {
  id: "headshot",
  url: "https://images.prismic.io/hedloc/headshot.jpg?auto=format,compress",
  alt: "test",
  copyright: null,
  dimensions: { width: 3, height: 2 },
  edit: { x: 0, y: 0, zoom: 1, background: "transparent" },
} as ImageFieldImage;

describe("Img", () => {
  it("renders blurred until the underlying image loads", async () => {
    const { container } = render(Img, { field });
    await tick();
    const img = container.querySelector("img")!;
    expect(img.className).toContain("progressive-img");
    expect(img.className).not.toContain("progressive-img--loaded");

    img.dispatchEvent(new Event("load"));
    await tick();
    expect(img.className).toContain("progressive-img--loaded");
  });

  it("unblurs on error too, so a broken image never stays blurred", async () => {
    const { container } = render(Img, { field });
    await tick();
    const img = container.querySelector("img")!;

    img.dispatchEvent(new Event("error"));
    await tick();
    expect(img.className).toContain("progressive-img--loaded");
  });

  /** Shim complete/naturalWidth on the prototype for one render (jsdom images are never complete). */
  async function renderAlreadyComplete(naturalWidth: number) {
    const desc = {
      complete: Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete"),
      naturalWidth: Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "naturalWidth"),
    };
    Object.defineProperty(HTMLImageElement.prototype, "complete", {
      get: () => true,
      configurable: true,
    });
    Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
      get: () => naturalWidth,
      configurable: true,
    });

    try {
      const { container } = render(Img, { field });
      await tick();
      return container.querySelector("img")!;
    } finally {
      Object.defineProperty(HTMLImageElement.prototype, "complete", desc.complete!);
      Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", desc.naturalWidth!);
    }
  }

  it("marks an already-complete (cached) image loaded without a load event", async () => {
    const img = await renderAlreadyComplete(3);
    expect(img.className).toContain("progressive-img--loaded");
  });

  it("unblurs an image that already FAILED before hydration (complete, naturalWidth 0)", async () => {
    // The error event fired pre-hydration and never refires — treating this
    // as "still loading" would leave the blur stuck forever.
    const img = await renderAlreadyComplete(0);
    expect(img.className).toContain("progressive-img--loaded");
  });

  it("appends the passed class after the progressive classes, and passes other props through", async () => {
    const { container } = render(Img, {
      field,
      class: "object-cover",
      loading: "lazy",
    });
    await tick();
    const img = container.querySelector("img")!;
    expect(img.className).toContain("progressive-img");
    expect(img.className).toContain("object-cover");
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.getAttribute("srcset")).toBeTruthy();
  });
});
