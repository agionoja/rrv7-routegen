🔁 rrv7-routegen

**File-based route helper generator for React Router v7** - Automatically generate type-safe route helpers based on your file structure.

```ts
// Generated helper for type-safe route references
import { routeFile } from ".routegen/route-file";

// Usage in route configuration
route("/comments", routeFile("comments")); // ✅ Type-safe
```

## ✨ Features

- 🗂️ **Automatic Route Detection**: Scans `app/routes` for React Router v7 route modules (with `action`, `loader`, or default component exports).
- 🛡️ **Type-Safe Helpers**: Generates a `routeFile()` function with a `RouteFilePath` type for compile-time safety.
- ⚡️ **Watch Mode**: Real-time updates when route files are added, modified, or removed.
- 🔧 **Configurable**: Customize input/output directories and file names via CLI flags or a `routegen.config.ts`/`js` file.
- 📦 **Zero Config Default**: Works out of the box with sensible defaults.
- 🔄 **Nested Routes**: Supports nested directory structures with slash notation (e.g., `comments/index.tsx` → `comments/index`).
- 🧩 **JavaScript & TypeScript**: Compatible with `.js`, `.jsx`, `.ts`, and `.tsx` files.
- 🚀 **Runtime Agnostic**: Runs on Node.js and Bun.

## 📦 Installation

### As a Development Dependency

```bash
# Using npm
npm install rrv7-routegen --save-dev

# Using Bun
bun add rrv7-routegen --dev
```

### For Local Development (Linking)

1. From the `rrv7-routegen` project root:

   ```bash
   # Build the package
   bun run build
   
   # Link globally
   bun link
   ```

2. In your target project:

   ```bash
   # Link the package
   bun link rrv7-routegen
   
   # Add to package.json
   bun add rrv7-routegen --dev
   ```

## 🚀 Usage

### File Structure

The tool scans the `app/routes` directory by default for route modules.

```bash
app/
└── routes/
    ├── home.tsx
    ├── comments/
    │   ├── index.tsx
    │   └── details.tsx
    └── settings.tsx
```

### CLI Commands

**Generate the route file once:**

```bash
bunx rrv7-routegen generate
# or
npx rrv7-routegen generate
```

**Watch for changes and regenerate automatically:**

```bash
bunx rrv7-routegen watch
# or
npx rrv7-routegen watch
```

**Default behavior (runs** `generate` **if no command is specified):**

```bash
bunx rrv7-routegen
# or
npx rrv7-routegen
```

### CLI Options

Customize the tool's behavior with the following options:

| Option | Description | Default |
| --- | --- | --- |
| `--route-dir <path>` | Directory to scan for routes | `app/routes` |
| `--out-dir <path>` | Output directory for generated files | `.routegen` |
| `--output-file-name <name>` | Name of the generated route file | `route-file.ts` |

Example with custom options:

```bash
bunx rrv7-routegen generate --route-dir src/routes --out-dir generated --output-file-name routes.ts
```

### Configuration File

You can configure the tool via a `routegen.config.ts` or `routegen.config.js` file using the `routeConfig` function.

**Example** `routegen.config.ts`**:**

```typescript
import { routeConfig } from "rrv7-routegen";

export default routeConfig({
  routeDir: "src/routes",
  outDir: "generated",
  outputFileName: "routes.ts",
});
```

**Example** `routegen.config.js`**:**

```javascript
const { routeConfig } = require("rrv7-routegen");

module.exports = routeConfig({
  routeDir: "src/routes",
  outDir: "generated",
  outputFileName: "routes.ts",
});
```

### Generated Output

The tool generates a file (e.g., `.routegen/route-file.ts`) with a type-safe helper:

```typescript
// AUTO-GENERATED — DO NOT EDIT
export type RouteFilePath =
        | "home"
        | "comments/index"
        | "comments/details"
        | "settings";

export function routeFile(path: RouteFilePath) {
   switch (path) {
      case "home": return "./routes/home.tsx";
      case "comments/index": return "./routes/comments/index.tsx";
      case "comments/details": return "./routes/comments/details.tsx";
      case "settings": return "./routes/settings.tsx";
      default: throw new Error(`Invalid routeFile: ${path}`);
   }
}
```

### Integration Example

Use the generated helper in your React Router v7 configuration:

```tsx
// routes.config.ts
import { routeFile } from ".routegen/route-file";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
   {
      path: "/",
      element: routeFile("home"),
   },
   {
      path: "/comments",
      children: [
         { index: true, element: routeFile("comments/index") },
         { path: ":id", element: routeFile("comments/details") },
      ],
   },
   {
      path: "/settings",
      element: routeFile("settings"),
   },
]);
```

### Programmatic Usage

You can use the tool programmatically in your scripts:

```javascript
import { runGeneration, runWatchMode } from "rrv7-routegen";

await runGeneration({ routeDir: "src/routes", outDir: "generated" });
await runWatchMode({ routeDir: "src/routes", outDir: "generated" });
```

## 🛠️ Development

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/rrv7-routegen.git
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Build the project:

   ```bash
   bun run build
   ```

4. Run tests:

   ```bash
   bun test
   ```

5. Develop locally:

   ```bash
   bun run dev
   ```

## 🧪 Testing

The project includes a comprehensive test suite using Bun's test runner. Tests cover:

- Route detection logic (`route-detection.test.ts`)
- Route file generation (`generator.test.ts`)
- Watch mode functionality (`watch.test.ts`)
- Configuration loading (`load-config.test.ts`)

Run tests with:

```bash
bun test
```

## ❓ FAQ

**Q: How does the tool detect route modules?**\
A: It analyzes files for React Router v7-specific exports (`action`, `loader`, or a default React component) using TypeScript's AST parser.

**Q: How are nested routes handled?**\
A: Nested directories are flattened to slash notation in the `RouteFilePath` type (e.g., `comments/index.tsx` → `"comments/index"`).

**Q: Can I use JavaScript files instead of TypeScript?**\
A: Yes, the tool supports `.js`, `.jsx`, `.ts`, and `.tsx` files.

**Q: Can I customize the route key format?**\
A: Not currently, but future versions may add a `routeKeyFormat` config option.

**Q: Why does watch mode fail with Yarn?**\
A: Yarn’s script execution may require explicit `generate` in `package.json`. Ensure `"generate:routes": "routegen generate"` is set.

## 📄 License

MIT © \[Your Name\]\
Inspired by Remix and React Router v7 routing concepts.