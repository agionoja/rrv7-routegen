// src/route-detection.test.ts
import { expect, test, describe, mock, beforeEach, afterEach } from "bun:test";
import { isRouteModule } from "./route-detection";
import fs from "fs/promises";

// Create mock for fs.readFile
const mockReadFile = mock(() => Promise.resolve("mock content"));
const mockConsoleError = mock(console.error);

describe("Route Detection", () => {
  // Store original functions
  const originalReadFile = fs.readFile;
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Apply mocks
    fs.readFile = mockReadFile as any;
    console.error = mockConsoleError;

    // Reset mocks between tests
    mockReadFile.mockReset();
    mockConsoleError.mockReset();
  });

  afterEach(() => {
    // Restore original functions after each test
    fs.readFile = originalReadFile;
    console.error = originalConsoleError;
  });

  test("should detect a file with action export", async () => {
    mockReadFile.mockImplementation(() =>
      Promise.resolve(`
      import { json } from 'remix';
      
      export async function action({ request }) {
        return json({ success: true });
      }
    `),
    );

    const result = await isRouteModule("test/path/file.tsx");
    expect(result).toBe(true);
  });

  test("should detect a file with loader export", async () => {
    mockReadFile.mockImplementation(() =>
      Promise.resolve(`
      import { json } from 'remix';
      
      export const loader = async ({ request }) => {
        return json({ data: "example" });
      };
    `),
    );

    const result = await isRouteModule("test/path/file.tsx");
    expect(result).toBe(true);
  });

  test("should detect a file with default component export", async () => {
    mockReadFile.mockImplementation(() =>
      Promise.resolve(`
      import React from 'react';
      
      export default function HomePage() {
        return <div>Welcome to the home page</div>;
      }
    `),
    );

    const result = await isRouteModule("test/path/file.tsx");
    expect(result).toBe(true);
  });

  test("should not detect a utility file as a route module", async () => {
    mockReadFile.mockImplementation(() =>
      Promise.resolve(`
      export function formatDate(date) {
        return new Date(date).toLocaleDateString();
      }
      
      export function capitalizeString(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
      }
    `),
    );

    const result = await isRouteModule("test/path/utils.ts");
    expect(result).toBe(false);
  });

  test("should handle errors gracefully", async () => {
    mockReadFile.mockImplementation(() =>
      Promise.reject(new Error("File not found")),
    );

    const result = await isRouteModule("nonexistent/file.tsx");
    expect(result).toBe(false);
    expect(mockConsoleError).toHaveBeenCalled();
  });
});
