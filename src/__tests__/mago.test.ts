import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

import { execFile } from "node:child_process";
import * as mago from "../mago";

function mockExecFile(
  stdout: string,
  stderr = "",
  exitCode: number | null = 0,
) {
  vi.mocked(execFile).mockImplementation(
    (_cmd: any, _args: any, _opts: any, cb: any) => {
      const err =
        exitCode !== 0
          ? Object.assign(new Error("fail"), { code: exitCode })
          : null;
      cb(err, stdout, stderr);
      return { stdin: { write: vi.fn(), end: vi.fn() } } as any;
    },
  );
}

describe("mago", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("format", () => {
    it("returns formatted output on success", async () => {
      mockExecFile("<?php\necho 'formatted';\n");

      const result = await mago.format(
        "/bin/mago",
        "/workspace",
        "<?php\necho 'unformatted' ;\n",
      );

      expect(result.formatted).toBe("<?php\necho 'formatted';\n");
      expect(result.error).toBeUndefined();
    });

    it("passes stdin source to the process", async () => {
      const source = "<?php echo 'hello';";
      mockExecFile(source);

      await mago.format("/bin/mago", "/workspace", source);

      expect(execFile).toHaveBeenCalledWith(
        "/bin/mago",
        expect.arrayContaining(["format", "--stdin-input"]),
        expect.objectContaining({ cwd: "/workspace" }),
        expect.any(Function),
      );
    });

    it("includes --config when configPath is provided", async () => {
      mockExecFile("output");

      await mago.format(
        "/bin/mago",
        "/workspace",
        "source",
        "/custom/mago.toml",
      );

      expect(execFile).toHaveBeenCalledWith(
        "/bin/mago",
        expect.arrayContaining(["--config", "/custom/mago.toml"]),
        expect.any(Object),
        expect.any(Function),
      );
    });

    it("includes --php-version when phpVersion is provided", async () => {
      mockExecFile("output");

      await mago.format("/bin/mago", "/workspace", "source", undefined, "8.2");

      expect(execFile).toHaveBeenCalledWith(
        "/bin/mago",
        expect.arrayContaining(["--php-version", "8.2"]),
        expect.any(Object),
        expect.any(Function),
      );
    });

    it("returns original source and error on non-zero exit", async () => {
      mockExecFile("", "Some error", 1);

      const source = "<?php echo 'hello';";
      const result = await mago.format("/bin/mago", "/workspace", source);

      expect(result.formatted).toBe(source);
      expect(result.error).toBe("Some error");
    });

    it("returns default error message when stderr is empty", async () => {
      mockExecFile("", "", 1);

      const result = await mago.format("/bin/mago", "/workspace", "src");

      expect(result.error).toBe("Format failed with no output");
    });
  });

  describe("lint", () => {
    it("parses JSON output into issues", async () => {
      const jsonOutput = JSON.stringify({
        issues: [
          {
            level: "Warning",
            code: "strict-types",
            message: "Missing strict_types",
            notes: [],
            help: "Add declare(strict_types=1);",
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
          },
        ],
      });
      mockExecFile(jsonOutput);

      const issues = await mago.lint(
        "/bin/mago",
        "/workspace",
        "/workspace/test.php",
      );

      expect(issues).toHaveLength(1);
      expect(issues[0]!.code).toBe("strict-types");
      expect(issues[0]!.level).toBe("Warning");
    });

    it("passes file path and --reporting-format json", async () => {
      mockExecFile('{"issues":[]}');

      await mago.lint("/bin/mago", "/workspace", "/workspace/test.php");

      expect(execFile).toHaveBeenCalledWith(
        "/bin/mago",
        expect.arrayContaining([
          "lint",
          "--reporting-format",
          "json",
          "/workspace/test.php",
        ]),
        expect.any(Object),
        expect.any(Function),
      );
    });

    it("returns empty array for empty output", async () => {
      mockExecFile("");

      const issues = await mago.lint(
        "/bin/mago",
        "/workspace",
        "/workspace/test.php",
      );
      expect(issues).toEqual([]);
    });

    it("returns empty array for invalid JSON", async () => {
      mockExecFile("not json at all");

      const issues = await mago.lint(
        "/bin/mago",
        "/workspace",
        "/workspace/test.php",
      );
      expect(issues).toEqual([]);
    });
  });

  describe("lintWorkspace", () => {
    it("runs without file path argument", async () => {
      mockExecFile('{"issues":[]}');

      await mago.lintWorkspace("/bin/mago", "/workspace");

      const args = vi.mocked(execFile).mock.calls[0]![1] as string[];
      expect(args).toContain("lint");
      expect(args).toContain("--reporting-format");
      // Should NOT contain a specific file path after the common args
      const lastArg = args[args.length - 1];
      expect(lastArg).not.toMatch(/\.php$/);
    });
  });

  describe("analyze", () => {
    it("passes analyze command and file path", async () => {
      mockExecFile('{"issues":[]}');

      await mago.analyze("/bin/mago", "/workspace", "/workspace/test.php");

      expect(execFile).toHaveBeenCalledWith(
        "/bin/mago",
        expect.arrayContaining([
          "analyze",
          "--reporting-format",
          "json",
          "/workspace/test.php",
        ]),
        expect.any(Object),
        expect.any(Function),
      );
    });
  });

  describe("analyzeWorkspace", () => {
    it("runs analyze without file path argument", async () => {
      mockExecFile('{"issues":[]}');

      await mago.analyzeWorkspace("/bin/mago", "/workspace");

      const args = vi.mocked(execFile).mock.calls[0]![1] as string[];
      expect(args).toContain("analyze");
      expect(args).toContain("--reporting-format");
      const lastArg = args[args.length - 1];
      expect(lastArg).not.toMatch(/\.php$/);
    });

    it("passes configPath and phpVersion", async () => {
      mockExecFile('{"issues":[]}');

      await mago.analyzeWorkspace(
        "/bin/mago",
        "/workspace",
        "/custom.toml",
        "8.3",
      );

      expect(execFile).toHaveBeenCalledWith(
        "/bin/mago",
        expect.arrayContaining([
          "--config",
          "/custom.toml",
          "--php-version",
          "8.3",
        ]),
        expect.any(Object),
        expect.any(Function),
      );
    });
  });

  describe("fix", () => {
    it("passes --fix flag for safe fixes", async () => {
      mockExecFile("");

      await mago.fix("/bin/mago", "/workspace", "/workspace/test.php", false);

      const args = vi.mocked(execFile).mock.calls[0]![1] as string[];
      expect(args).toContain("--fix");
      expect(args).not.toContain("--unsafe");
      expect(args).not.toContain("--potentially-unsafe");
    });

    it("passes --unsafe and --potentially-unsafe when unsafe is true", async () => {
      mockExecFile("");

      await mago.fix("/bin/mago", "/workspace", "/workspace/test.php", true);

      const args = vi.mocked(execFile).mock.calls[0]![1] as string[];
      expect(args).toContain("--fix");
      expect(args).toContain("--unsafe");
      expect(args).toContain("--potentially-unsafe");
    });

    it("returns success on zero exit code", async () => {
      mockExecFile("");

      const result = await mago.fix(
        "/bin/mago",
        "/workspace",
        "/workspace/test.php",
        false,
      );
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("returns error on non-zero exit code", async () => {
      mockExecFile("", "Fix error occurred", 1);

      const result = await mago.fix(
        "/bin/mago",
        "/workspace",
        "/workspace/test.php",
        false,
      );
      expect(result.success).toBe(false);
      expect(result.error).toBe("Fix error occurred");
    });
  });

  describe("fix — edge cases", () => {
    it("returns success when exitCode is null", async () => {
      mockExecFile("", "", null);

      const result = await mago.fix(
        "/bin/mago",
        "/workspace",
        "/workspace/test.php",
        false,
      );
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("execMago — error without .code property", () => {
    it("falls back to exitCode 1 when error has no code property", async () => {
      vi.mocked(execFile).mockImplementation(
        (_cmd: any, _args: any, _opts: any, cb: any) => {
          const err = new Error("signal kill");
          cb(err, "", "process killed");
          return { stdin: { write: vi.fn(), end: vi.fn() } } as any;
        },
      );

      const result = await mago.format(
        "/bin/mago",
        "/workspace",
        "<?php echo 1;",
      );

      // Error without .code should fallback to exitCode 1 (non-zero), so error path
      expect(result.error).toBe("process killed");
    });
  });

  describe("explainRule", () => {
    it("passes --explain with rule code", async () => {
      mockExecFile("Rule explanation text");

      const result = await mago.explainRule(
        "/bin/mago",
        "/workspace",
        "strict-types",
      );

      expect(result).toBe("Rule explanation text");
      expect(execFile).toHaveBeenCalledWith(
        "/bin/mago",
        expect.arrayContaining(["--explain", "strict-types"]),
        expect.any(Object),
        expect.any(Function),
      );
    });

    it("returns fallback text when no output", async () => {
      mockExecFile("", "");

      const result = await mago.explainRule(
        "/bin/mago",
        "/workspace",
        "unknown-rule",
      );
      expect(result).toBe("No documentation found.");
    });

    it("returns stderr when stdout is empty but stderr has content", async () => {
      mockExecFile("", "Rule not recognized");

      const result = await mago.explainRule(
        "/bin/mago",
        "/workspace",
        "bad-rule",
      );
      expect(result).toBe("Rule not recognized");
    });
  });
});
