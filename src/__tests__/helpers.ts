import { Position, Uri } from "../__mocks__/vscode";
import type { MagoIssue } from "../types";

/** Create a minimal mock TextDocument for testing. */
export function createMockDocument(
  content: string,
  filePath = "/workspace/test.php",
) {
  const lines = content.split("\n");

  return {
    uri: Uri.file(filePath),
    languageId: "php",
    getText: () => content,
    positionAt(offset: number): Position {
      let remaining = offset;
      for (let line = 0; line < lines.length; line++) {
        const lineLength = lines[line]!.length + 1; // +1 for newline
        if (remaining < lineLength) {
          return new Position(line, remaining);
        }
        remaining -= lineLength;
      }
      // Past end of document
      return new Position(lines.length - 1, lines[lines.length - 1]!.length);
    },
    lineAt(line: number) {
      return { text: lines[line] ?? "" };
    },
  };
}

/** Fixture: a typical mago lint issue with a primary annotation. */
export function createTestIssue(overrides?: Partial<MagoIssue>): MagoIssue {
  return {
    level: "Warning",
    code: "strict-types",
    message: "Missing `declare(strict_types=1);` statement.",
    notes: ["The strict_types directive enforces strict type checking."],
    help: "Add `declare(strict_types=1);` at the top of your file.",
    annotations: [
      {
        kind: "Primary",
        span: {
          file_id: {
            name: "test.php",
            path: "/workspace/test.php",
            size: 50,
            file_type: "Host",
          },
          start: { offset: 0, line: 0 },
          end: { offset: 50, line: 3 },
        },
      },
    ],
    ...overrides,
  };
}

/** Fixture: a mago issue with a safe Replace suggestion. */
export function createFixableIssue(): MagoIssue {
  return {
    level: "Warning",
    code: "identity-comparison",
    message: "Use `===` instead of `==`.",
    notes: [],
    help: "Use `===` to ensure both value and type are equal.",
    annotations: [
      {
        message: "Equality operator is used here",
        kind: "Primary",
        span: {
          file_id: {
            name: "test.php",
            path: "/workspace/test.php",
            size: 50,
            file_type: "Host",
          },
          start: { offset: 20, line: 2 },
          end: { offset: 22, line: 2 },
        },
      },
    ],
    suggestions: [
      [
        {
          name: "test.php",
          path: "/workspace/test.php",
          size: 50,
          file_type: "Host",
        },
        {
          operations: [
            {
              type: "Replace",
              value: {
                range: { start: 20, end: 22 },
                text: "===",
                safety_classification: { type: "Safe" },
              },
            },
          ],
        },
      ],
    ],
  };
}

/** Fixture: a mago issue with an Unsafe Delete suggestion. */
export function createDeleteFixableIssue(): MagoIssue {
  return {
    level: "Warning",
    code: "redundant-code",
    message: "Redundant code detected.",
    notes: [],
    help: "Remove the redundant code.",
    annotations: [
      {
        kind: "Primary",
        span: {
          file_id: {
            name: "test.php",
            path: "/workspace/test.php",
            size: 50,
            file_type: "Host",
          },
          start: { offset: 10, line: 1 },
          end: { offset: 20, line: 1 },
        },
      },
    ],
    suggestions: [
      [
        {
          name: "test.php",
          path: "/workspace/test.php",
          size: 50,
          file_type: "Host",
        },
        {
          operations: [
            {
              type: "Delete",
              value: {
                range: { start: 10, end: 20 },
                safety_classification: { type: "Unsafe" },
              },
            },
          ],
        },
      ],
    ],
  };
}

/** Fixture: a mago issue with an unsafe Insert suggestion. */
export function createUnsafeFixableIssue(): MagoIssue {
  return {
    level: "Warning",
    code: "strict-types",
    message: "Missing `declare(strict_types=1);`.",
    notes: [],
    help: "Add `declare(strict_types=1);`.",
    annotations: [
      {
        kind: "Primary",
        span: {
          file_id: {
            name: "test.php",
            path: "/workspace/test.php",
            size: 50,
            file_type: "Host",
          },
          start: { offset: 0, line: 0 },
          end: { offset: 50, line: 3 },
        },
      },
    ],
    suggestions: [
      [
        {
          name: "test.php",
          path: "/workspace/test.php",
          size: 50,
          file_type: "Host",
        },
        {
          operations: [
            {
              type: "Insert",
              value: {
                offset: 5,
                text: "\n\ndeclare(strict_types=1);\n",
                safety_classification: { type: "PotentiallyUnsafe" },
              },
            },
          ],
        },
      ],
    ],
  };
}
