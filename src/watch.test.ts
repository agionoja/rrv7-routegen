// src/watch.test.ts
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { runWatchMode } from "./watch";
import path from "path";

// Type for the mocked chokidar watcher
interface MockWatcher {
  on: (event: string, handler: (...args: any[]) => void) => MockWatcher;
}

// Type guard to check if a value is a function
function isFunction(value: unknown): value is (...args: any[]) => void {
  return typeof value === "function";
}

// Mock chokidar.watch
const mockChokidarWatch = mock(() => {
  const watcher = {
    on: mock((event: string, handler: (...args: any[]) => void) => {
      handlers[event] = handler;
      return watcher;
    }),
  } as MockWatcher;
  return watcher;
});

// Mock child_process.spawn
const mockSpawn = mock(() => ({
  on: mock((event: string, handler: (code: number) => void) => {
    if (event === "close") setTimeout(() => handler(0), 10);
  }),
  stdout: { on: mock(() => {}) },
  stderr: { on: mock(() => {}) },
}));

// Mock child_process.execSync
const mockExecSync = mock((cmd: string): string => {
  if (cmd === "bun --version") return "1.0.0"; // Simulate Bun present
  return "version";
});

// Mock fs.accessSync
const mockAccessSync = mock((p: string): void => {
  if (p === "yarn.lock") throw new Error("File not found"); // No yarn.lock
  if (p === "pnpm-lock.yaml") throw new Error("File not found"); // No pnpm
});

// Mock console.log
const mockConsoleLog = mock((...args: any[]): void => {});

// Store event handlers
const handlers: Record<string, (...args: any[]) => void | undefined> = {};

// Set up module mocks
mock.module("chokidar", () => ({
  watch: mockChokidarWatch,
}));
mock.module("child_process", () => ({
  spawn: mockSpawn,
  execSync: mockExecSync,
}));
mock.module("fs", () => ({
  accessSync: mockAccessSync,
}));
mock.module("./watch", () => ({
  runWatchMode,
}));

describe("Watch Mode", () => {
  const originalConsoleLog = console.log;

  beforeEach(() => {
    mockChokidarWatch.mockReset();
    mockSpawn.mockReset();
    mockExecSync.mockReset();
    mockAccessSync.mockReset();
    mockConsoleLog.mockReset();
    for (const key in handlers) delete handlers[key];
    console.log = mockConsoleLog;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  test("should start watching app/routes directory", async () => {
    await runWatchMode();
    const expectedDir = path.resolve(process.cwd(), "app/routes");
    expect(mockChokidarWatch).toHaveBeenCalledWith(expectedDir, {
      ignoreInitial: true,
      persistent: true,
    });
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Watching app/routes"),
    );
  });

  test("should trigger generation when a file is added", async () => {
    await runWatchMode();

    expect(handlers["all"]).toBeDefined();
    if (isFunction(handlers["all"])) {
      handlers["all"](
        "add",
        path.join(process.cwd(), "app/routes/new-route.tsx"),
      );
    } else {
      throw new Error("handlers['all'] is not a function");
    }

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(mockSpawn).toHaveBeenCalledWith(
      "bun",
      [
        "x",
        "rrv7-routegen",
        "generate",
        "--route-dir=app/routes",
        "--out-dir=.routegen",
        "--output-file-name=route-file.ts",
      ],
      {
        stdio: "inherit",
      },
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("ADD: app/routes/new-route.tsx"),
    );
  });

  test("should ignore irrelevant events", async () => {
    await runWatchMode();

    expect(handlers["all"]).toBeDefined();
    if (isFunction(handlers["all"])) {
      handlers["all"](
        "raw",
        path.join(process.cwd(), "app/routes/ignored.tsx"),
      );
    } else {
      throw new Error("handlers['all'] is not a function");
    }

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(mockSpawn).not.toHaveBeenCalled();
  });

  test("should debounce multiple events", async () => {
    await runWatchMode();

    expect(handlers["all"]).toBeDefined();
    if (isFunction(handlers["all"])) {
      // Simulate rapid events
      handlers["all"]("add", path.join(process.cwd(), "app/routes/first.tsx"));
      handlers["all"]("add", path.join(process.cwd(), "app/routes/second.tsx"));
    } else {
      throw new Error("handlers['all'] is not a function");
    }

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(mockSpawn).toHaveBeenCalledTimes(1);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("ADD: app/routes/first.tsx"),
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("ADD: app/routes/second.tsx"),
    );
  });
});
