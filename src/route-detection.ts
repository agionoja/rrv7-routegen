// src/route-detection.ts
import fs from "fs/promises";
import ts from "typescript";

/**
 * Detects if a file is a valid route module by checking for:
 * 1. Exported action function
 * 2. Exported loader function
 * 3. Default export that's a functional component (React)
 *
 * This is specific to React Router v7 route files
 */
export async function isRouteModule(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, "utf8");

    // Parse the file
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
    );

    // Check for action or loader exports or default component export
    let hasActionExport = false;
    let hasLoaderExport = false;
    let hasDefaultComponentExport = false;

    // Look through the file's statements
    for (const node of sourceFile.statements) {
      // Check for named function exports (action/loader)
      if (
        ts.isFunctionDeclaration(node) &&
        node.name &&
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        const exportName = node.name.text;
        if (exportName === "action") hasActionExport = true;
        if (exportName === "loader") hasLoaderExport = true;
      }

      // Check for variable declarations that might be exported functions
      if (
        ts.isVariableStatement(node) &&
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        for (const decl of node.declarationList.declarations) {
          const declName = decl.name.getText(sourceFile);
          if (declName === "action") hasActionExport = true;
          if (declName === "loader") hasLoaderExport = true;
        }
      }

      // Check for default export that might be a component
      if (
        (ts.isExportAssignment(node) && node.isExportEquals === false) ||
        (ts.isFunctionDeclaration(node) &&
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword))
      ) {
        // This is a default export - check if it looks like a React component
        hasDefaultComponentExport = isLikelyReactComponent(node, sourceFile);
      }
    }

    return hasActionExport || hasLoaderExport || hasDefaultComponentExport;
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error);
    return false;
  }
}

/**
 * Heuristically determines if a node is likely a React component
 */
function isLikelyReactComponent(
  node: ts.Node,
  sourceFile: ts.SourceFile,
): boolean {
  // Simple heuristic: check for React imports or JSX syntax
  const fileContent = sourceFile.getText();

  // Check for React import
  const hasReactImport =
    fileContent.includes("import React") ||
    fileContent.includes("import * as React") ||
    fileContent.includes('from "react"') ||
    fileContent.includes("from 'react'");

  // Check for JSX syntax patterns
  const hasJsxSyntax =
    fileContent.includes("<") &&
    (fileContent.includes("/>") || fileContent.includes("</"));

  // Check for component naming patterns (PascalCase function names)
  const componentNamePattern = /function\s+([A-Z][a-zA-Z0-9]*)/;
  const hasComponentName = componentNamePattern.test(fileContent);

  // Special case: look for export default function with JSX return
  const defaultExportFunctionPattern = /export\s+default\s+function/;
  const hasDefaultExportFunction =
    defaultExportFunctionPattern.test(fileContent);

  // Check for RRv7/Remix-specific imports
  const hasRouterImports =
    fileContent.includes('from "@remix-run/react"') ||
    fileContent.includes('from "react-router"') ||
    fileContent.includes('from "react-router-dom"');

  return (
    (hasReactImport && (hasJsxSyntax || hasComponentName)) ||
    (hasDefaultExportFunction && hasJsxSyntax) ||
    (hasRouterImports && (hasDefaultExportFunction || hasComponentName))
  );
}
