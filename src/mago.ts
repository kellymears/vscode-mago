import { execFile } from "node:child_process";
import type { CliResult, MagoIssue, MagoLintOutput } from "./types.js";
import * as logger from "./logger.js";

interface ExecOptions {
  readonly binaryPath: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly stdin?: string;
  readonly timeout?: number;
}

function execMago(options: ExecOptions): Promise<CliResult> {
  const { binaryPath, args, cwd, stdin, timeout = 30000 } = options;

  logger.debug(`exec: ${binaryPath} ${args.join(" ")} (cwd: ${cwd})`);

  return new Promise((resolve) => {
    const proc = execFile(
      binaryPath,
      args as string[],
      {
        cwd,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
        timeout,
      },
      (err, stdout, stderr) => {
        const exitCode =
          err && "code" in err ? (err.code as number | null) : err ? 1 : 0;
        resolve({ stdout: stdout ?? "", stderr: stderr ?? "", exitCode });
      },
    );

    if (stdin !== undefined && proc.stdin) {
      proc.stdin.write(stdin);
      proc.stdin.end();
    }
  });
}

function buildCommonArgs(
  configPath: string | undefined,
  phpVersion: string | undefined,
  workspaceRoot: string,
): string[] {
  const args: string[] = ["--workspace", workspaceRoot, "--no-color"];
  if (configPath) args.push("--config", configPath);
  if (phpVersion) args.push("--php-version", phpVersion);
  return args;
}

// --- Format ---

export async function format(
  binaryPath: string,
  cwd: string,
  source: string,
  configPath?: string,
  phpVersion?: string,
): Promise<{ formatted: string; error?: string }> {
  const args = [
    "format",
    "--stdin-input",
    ...buildCommonArgs(configPath, phpVersion, cwd),
  ];

  const result = await execMago({ binaryPath, args, cwd, stdin: source });

  if (result.exitCode !== 0 && result.exitCode !== null) {
    const errMsg = result.stderr.trim() || "Format failed with no output";
    logger.error(`format error: ${errMsg}`);
    return { formatted: source, error: errMsg };
  }

  return { formatted: result.stdout };
}

// --- Lint ---

export async function lint(
  binaryPath: string,
  cwd: string,
  filePath: string,
  configPath?: string,
  phpVersion?: string,
): Promise<MagoIssue[]> {
  const args = [
    "lint",
    "--reporting-format",
    "json",
    ...buildCommonArgs(configPath, phpVersion, cwd),
    filePath,
  ];

  return runDiagnosticCommand(binaryPath, cwd, args, "lint");
}

export async function lintWorkspace(
  binaryPath: string,
  cwd: string,
  configPath?: string,
  phpVersion?: string,
): Promise<MagoIssue[]> {
  const args = [
    "lint",
    "--reporting-format",
    "json",
    ...buildCommonArgs(configPath, phpVersion, cwd),
  ];

  return runDiagnosticCommand(binaryPath, cwd, args, "lint workspace");
}

// --- Analyze ---

export async function analyze(
  binaryPath: string,
  cwd: string,
  filePath: string,
  configPath?: string,
  phpVersion?: string,
): Promise<MagoIssue[]> {
  const args = [
    "analyze",
    "--reporting-format",
    "json",
    ...buildCommonArgs(configPath, phpVersion, cwd),
    filePath,
  ];

  return runDiagnosticCommand(binaryPath, cwd, args, "analyze");
}

export async function analyzeWorkspace(
  binaryPath: string,
  cwd: string,
  configPath?: string,
  phpVersion?: string,
): Promise<MagoIssue[]> {
  const args = [
    "analyze",
    "--reporting-format",
    "json",
    ...buildCommonArgs(configPath, phpVersion, cwd),
  ];

  return runDiagnosticCommand(binaryPath, cwd, args, "analyze workspace");
}

// --- Fix ---

export async function fix(
  binaryPath: string,
  cwd: string,
  filePath: string,
  unsafe: boolean,
  configPath?: string,
  phpVersion?: string,
): Promise<{ success: boolean; error?: string }> {
  const args = [
    "lint",
    "--fix",
    ...buildCommonArgs(configPath, phpVersion, cwd),
    filePath,
  ];

  if (unsafe) {
    args.push("--unsafe", "--potentially-unsafe");
  }

  const result = await execMago({ binaryPath, args, cwd });

  if (result.exitCode !== 0 && result.exitCode !== null) {
    const errMsg = result.stderr.trim() || "Fix failed";
    logger.error(`fix error: ${errMsg}`);
    return { success: false, error: errMsg };
  }

  return { success: true };
}

// --- Explain ---

export async function explainRule(
  binaryPath: string,
  cwd: string,
  ruleCode: string,
): Promise<string> {
  const result = await execMago({
    binaryPath,
    args: ["lint", "--explain", ruleCode, "--no-color"],
    cwd,
  });

  return result.stdout || result.stderr || "No documentation found.";
}

// --- Shared ---

async function runDiagnosticCommand(
  binaryPath: string,
  cwd: string,
  args: string[],
  label: string,
): Promise<MagoIssue[]> {
  const result = await execMago({ binaryPath, args, cwd });

  if (!result.stdout.trim()) {
    logger.debug(`${label}: no output`);
    return [];
  }

  try {
    const parsed = JSON.parse(result.stdout) as MagoLintOutput;
    logger.debug(`${label}: ${parsed.issues.length} issue(s)`);
    return [...parsed.issues];
  } catch (e) {
    logger.error(
      `${label}: failed to parse JSON output: ${e instanceof Error ? e.message : String(e)}`,
    );
    logger.debug(`${label} raw output: ${result.stdout.slice(0, 500)}`);
    return [];
  }
}
