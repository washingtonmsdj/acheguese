import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsdom não implementa ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(window as Record<string, unknown>).ResizeObserver = ResizeObserverMock;

// Canvas: o preview usa canvas.getContext("2d")
// jsdom expõe getContext, mas lança "Not implemented".
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: () => {
    const gradient = { addColorStop: () => {} };
    return {
      canvas: document.createElement("canvas"),
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      rect: () => {},
      clip: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
      translate: () => {},
      scale: () => {},
      setTransform: () => {},
      clearRect: () => {},
      fillText: () => {},
      strokeText: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      ellipse: () => {},
      closePath: () => {},
      fill: () => {},
      stroke: () => {},
      drawImage: () => {},
      measureText: () => ({ width: 0 }),
    };
  },
});

// RAF: o game loop usa requestAnimationFrame
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now()), 16);
}
if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = (id: number) => window.clearTimeout(id);
}

// Scroll: Radix ScrollArea / viewport pode chamar scrollTo
if (!(Element.prototype as unknown as Record<string, unknown>).scrollTo) {
  (Element.prototype as unknown as Record<string, unknown>).scrollTo = () => {};
}
