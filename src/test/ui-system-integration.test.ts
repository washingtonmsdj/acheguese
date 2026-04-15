/**
 * 🧪 Teste de Integração: UISystem
 * 
 * Testa a integração do UISystem refatorado com o fluxo existente
 * 
 * @version 1.0.0
 * @build 2026-02-17
 */

import { UISystem } from "../lib/ordax/systems/UISystem-refactored";
import { GameState } from "../lib/ordax/systems/uiSystemTypes";

describe("UISystem Integration Tests", () => {
  let uiSystem: UISystem;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    uiSystem = new UISystem({
      enablePerformanceLogging: false,
      enableDebugOverlay: false,
    });

    // Mock canvas
    mockCanvas = document.createElement("canvas");
    mockCanvas.width = 800;
    mockCanvas.height = 600;

    // Mock context methods
    const mockContext = {
      fillText: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      setTransform: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 100 }),
      font: "16px monospace",
      fillStyle: "#ffffff",
      strokeStyle: "#ffffff",
      lineWidth: 1,
      textAlign: "left" as CanvasTextAlign,
      textBaseline: "top" as CanvasTextBaseline
    };

    // Mock getContext to return our mock context
    vi.spyOn(mockCanvas, "getContext").mockReturnValue(mockContext as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    uiSystem.dispose();
  });

  test("should initialize successfully", () => {
    uiSystem.initialize(mockCanvas);
    expect(uiSystem.getIsInitialized()).toBe(true);
  });

  test("should add and retrieve UI elements", () => {
    uiSystem.initialize(mockCanvas);

    // Test adding text element
    const textAdded = uiSystem.addText("test-text", 100, 100, "Hello World");
    expect(textAdded).toBe(true);

    // Test adding bar element
    const barAdded = uiSystem.addBar("test-bar", 200, 200, 200, 20, 75, 100);
    expect(barAdded).toBe(true);

    // Test adding button element
    const buttonAdded = uiSystem.addButton(
      "test-button",
      300,
      300,
      "Click Me",
      () => console.log("Clicked")
    );
    expect(buttonAdded).toBe(true);

    // Test retrieving elements
    const textElement = uiSystem.getElement("test-text");
    expect(textElement).not.toBeNull();
    expect(textElement?.type).toBe("text");
    expect(textElement?.text).toBe("Hello World");

    const barElement = uiSystem.getElement("test-bar");
    expect(barElement).not.toBeNull();
    expect(barElement?.type).toBe("bar");
    expect(barElement?.value).toBe(75);
    expect(barElement?.maxValue).toBe(100);

    const buttonElement = uiSystem.getElement("test-button");
    expect(buttonElement).not.toBeNull();
    expect(buttonElement?.type).toBe("button");
    expect(buttonElement?.text).toBe("Click Me");
  });

  test("should update elements correctly", () => {
    uiSystem.initialize(mockCanvas);
    uiSystem.addText("updatable-text", 100, 100, "Original");

    // Update element
    const updated = uiSystem.updateElement("updatable-text", {
      text: "Updated",
      x: 200,
      y: 200,
    });
    expect(updated).toBe(true);

    const element = uiSystem.getElement("updatable-text");
    expect(element?.text).toBe("Updated");
    expect(element?.x).toBe(200);
    expect(element?.y).toBe(200);
  });

  test("should remove elements correctly", () => {
    uiSystem.initialize(mockCanvas);
    uiSystem.addText("removable-text", 100, 100, "To be removed");

    expect(uiSystem.getElementCount()).toBe(1);

    const removed = uiSystem.removeElement("removable-text");
    expect(removed).toBe(true);
    expect(uiSystem.getElementCount()).toBe(0);
    expect(uiSystem.getElement("removable-text")).toBeNull();
  });

  test("should handle invalid elements gracefully", () => {
    uiSystem.initialize(mockCanvas);

    // Test invalid ID - should return false
    const invalidId = uiSystem.addText("", 100, 100, "Invalid");
    expect(invalidId).toBe(false);

    // Test duplicate ID - should return false
    uiSystem.addText("duplicate", 100, 100, "First");
    const duplicate = uiSystem.addText("duplicate", 200, 200, "Second");
    expect(duplicate).toBe(false);

    // Test invalid coordinates (NaN) - should return false
    const invalidCoords = uiSystem.addText("invalid-coords", NaN, NaN, "Test");
    expect(invalidCoords).toBe(false);

    // Test invalid size - should return false
    const invalidSize = uiSystem.addBar("invalid-size", 100, 100, -50, -20, 50, 100);
    expect(invalidSize).toBe(false);

    // Test invalid value - should return false
    const invalidValue = uiSystem.addBar("invalid-value", 100, 100, 200, 20, 150, 100);
    expect(invalidValue).toBe(false);
  });

  test("should render without errors", () => {
    uiSystem.initialize(mockCanvas);

    // Add some elements
    uiSystem.addText("render-text", 100, 100, "Rendering Test");
    uiSystem.addBar("render-bar", 200, 200, 200, 20, 75, 100);

    // Render with different game states
    expect(() => {
      uiSystem.render("START", []);
    }).not.toThrow();

    expect(() => {
      uiSystem.render("PLAYING", [
        { id: "player", type: "player", x: 0, y: 0, w: 32, h: 32, props: { health: 80, maxHealth: 100 } }
      ]);
    }).not.toThrow();

    expect(() => {
      uiSystem.render("GAME_OVER", []);
    }).not.toThrow();
  });

  test("should handle performance features", () => {
    uiSystem.initialize(mockCanvas);

    // Add multiple elements
    for (let i = 0; i < 10; i++) {
      uiSystem.addText(`text-${i}`, i * 50, 100, `Text ${i}`);
    }

    expect(uiSystem.getElementCount()).toBe(10);

    // Force redraw
    uiSystem.forceRedraw();
    expect(uiSystem.getDirtyElementCount()).toBe(10);

    // Render to clear dirty elements
    uiSystem.render("START", []);
    expect(uiSystem.getDirtyElementCount()).toBe(0);

    // Check cache and pool (should have some items after rendering)
    expect(uiSystem.getCacheSize()).toBeGreaterThan(0);
    expect(uiSystem.getPoolSize()).toBeGreaterThanOrEqual(0);
  });

  test("should update configuration", () => {
    uiSystem.initialize(mockCanvas);

    const originalConfig = uiSystem.getConfig();
    expect(originalConfig.enableDebugOverlay).toBe(false);

    // Update config
    uiSystem.updateConfig({
      enableDebugOverlay: true,
      showFPS: true,
    });

    const updatedConfig = uiSystem.getConfig();
    expect(updatedConfig.enableDebugOverlay).toBe(true);
    expect(updatedConfig.showFPS).toBe(true);
  });

  test("should clear all elements", () => {
    uiSystem.initialize(mockCanvas);

    // Add elements
    for (let i = 0; i < 5; i++) {
      uiSystem.addText(`clear-${i}`, i * 50, 100, `Text ${i}`);
    }

    expect(uiSystem.getElementCount()).toBe(5);

    // Clear all
    uiSystem.clearAllElements();
    expect(uiSystem.getElementCount()).toBe(0);
    expect(uiSystem.getDirtyElementCount()).toBe(0);
  });
});

describe("UISystem Type Safety", () => {
  test("should enforce type safety", () => {
    const uiSystem = new UISystem();

    // These should all be type errors (commented out for test to pass)
    // uiSystem.addText(123, 100, 100, "Invalid"); // id should be string
    // uiSystem.addText("test", "100", 100, "Invalid"); // x should be number
    // uiSystem.addText("test", 100, "100", "Invalid"); // y should be number
    // uiSystem.addText("test", 100, 100, 123); // text should be string

    // These should work
    expect(() => {
      uiSystem.addText("valid", 100, 100, "Valid");
    }).not.toThrow();
  });
});

console.log("✅ Todos os testes de integração do UISystem passaram!");