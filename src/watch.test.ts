import { expect, test, describe, mock, beforeEach, afterEach } from "bun:test";
import { runWatchMode } from "./watch";
import chokidar from "chokidar";

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
  if (cmd === "bun --version") throw new Error("Command not found");
  return "version";
});

// Mock fs.accessSync
const mockAccessSync = mock((p: string): void => {
  if (p === "yarn.lock") return;
  throw new Error("File not found");
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
    runWatchMode();

    expect(mockChokidarWatch).toHaveBeenCalledWith("app/routes", {
      ignoreInitial: true,
      persistent: true,
    });
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Watching"),
    );
  });

  test("should trigger generation when a file is added", async () => {
    runWatchMode();

    expect(handlers["all"]).toBeDefined();
    if (isFunction(handlers["all"])) {
      handlers["all"]("add", "app/routes/new-route.tsx");
    } else {
      throw new Error("handlers['all'] is not a function");
    }

    // Wait briefly for debounce (simulated)
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(mockSpawn).toHaveBeenCalledWith("yarn", ["generate:routes"], {
      stdio: "inherit",
    });
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("ADD:"),
    );
  });

  test("should ignore irrelevant events", async () => {
    runWatchMode();

    expect(handlers["all"]).toBeDefined();
    if (isFunction(handlers["all"])) {
      handlers["all"]("change", "app/routes/ignored.tsx");
    } else {
      throw new Error("handlers['all'] is not a function");
    }

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(mockSpawn).not.toHaveBeenCalled();
    expect(mockConsoleLog).not.toHaveBeenCalledWith(
      expect.stringContaining("CHANGE:"),
    );
  });

  test("should debounce multiple events", async () => {
    runWatchMode();

    expect(handlers["all"]).toBeDefined();
    if (isFunction(handlers["all"])) {
      // Simulate rapid events
      handlers["all"]("add", "app/routes/first.tsx");
      handlers["all"]("add", "app/routes/second.tsx");
    } else {
      throw new Error("handlers['all'] is not a function");
    }

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(mockSpawn).toHaveBeenCalledTimes(1);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("ADD:"),
    );
  });
});
