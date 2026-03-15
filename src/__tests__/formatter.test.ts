import { describe, it, expect, vi, beforeEach } from "vitest";
import { Position } from "../__mocks__/vscode";
import { createMockDocument } from "./helpers";

vi.mock("../mago", () => ({
  format: vi.fn(),
}));

import * as mago from "../mago";
import { createFormattingProvider } from "../formatter";

const source = "<?php\necho 'unformatted' ;\n";
const formatted = "<?php\necho 'formatted';\n";
const mockDoc = createMockDocument(source);

function createProvider(binaryPath = "/bin/mago", root = "/workspace") {
  return createFormattingProvider(
    () => binaryPath,
    () => root,
    () => undefined,
    () => undefined,
    vi.fn(),
    vi.fn(),
  );
}

function createToken(cancelled = false) {
  return {
    isCancellationRequested: cancelled,
    onCancellationRequested: vi.fn(),
  } as any;
}

describe("formatter", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns a full-document replace edit when output differs", async () => {
    vi.mocked(mago.format).mockResolvedValue({ formatted });

    const provider = createProvider();
    const edits = await provider.provideDocumentFormattingEdits(
      mockDoc as any,
      {} as any,
      createToken(),
    );

    expect(edits).toHaveLength(1);
    expect(edits![0]!.newText).toBe(formatted);
    expect(edits![0]!.range.start).toEqual(new Position(0, 0));
  });

  it("returns empty array when output matches input", async () => {
    vi.mocked(mago.format).mockResolvedValue({ formatted: source });

    const provider = createProvider();
    const edits = await provider.provideDocumentFormattingEdits(
      mockDoc as any,
      {} as any,
      createToken(),
    );

    expect(edits).toEqual([]);
  });

  it("returns empty array on format error", async () => {
    vi.mocked(mago.format).mockResolvedValue({
      formatted: source,
      error: "Parse error",
    });

    const provider = createProvider();
    const edits = await provider.provideDocumentFormattingEdits(
      mockDoc as any,
      {} as any,
      createToken(),
    );

    expect(edits).toEqual([]);
  });

  it("returns empty array when binary path is missing", async () => {
    const provider = createFormattingProvider(
      () => undefined,
      () => "/workspace",
      () => undefined,
      () => undefined,
      vi.fn(),
      vi.fn(),
    );

    const edits = await provider.provideDocumentFormattingEdits(
      mockDoc as any,
      {} as any,
      createToken(),
    );

    expect(edits).toEqual([]);
    expect(mago.format).not.toHaveBeenCalled();
  });

  it("returns empty array when workspace root is missing", async () => {
    const provider = createFormattingProvider(
      () => "/bin/mago",
      () => undefined,
      () => undefined,
      () => undefined,
      vi.fn(),
      vi.fn(),
    );

    const edits = await provider.provideDocumentFormattingEdits(
      mockDoc as any,
      {} as any,
      createToken(),
    );

    expect(edits).toEqual([]);
  });

  it("returns empty array when cancellation is requested before formatting", async () => {
    const provider = createProvider();
    const edits = await provider.provideDocumentFormattingEdits(
      mockDoc as any,
      {} as any,
      createToken(true),
    );

    expect(edits).toEqual([]);
    expect(mago.format).not.toHaveBeenCalled();
  });

  it("returns empty array when cancellation is requested after formatting", async () => {
    // Token starts not-cancelled, but becomes cancelled after format resolves
    const token = {
      isCancellationRequested: false,
      onCancellationRequested: vi.fn(),
    };

    vi.mocked(mago.format).mockImplementation(async () => {
      // Simulate cancellation during format
      token.isCancellationRequested = true;
      return { formatted };
    });

    const provider = createProvider();
    const edits = await provider.provideDocumentFormattingEdits(
      mockDoc as any,
      {} as any,
      token as any,
    );

    expect(edits).toEqual([]);
  });

  it("calls onRunning and onDone callbacks", async () => {
    vi.mocked(mago.format).mockResolvedValue({ formatted });

    const onRunning = vi.fn();
    const onDone = vi.fn();
    const provider = createFormattingProvider(
      () => "/bin/mago",
      () => "/workspace",
      () => undefined,
      () => undefined,
      onRunning,
      onDone,
    );

    await provider.provideDocumentFormattingEdits(
      mockDoc as any,
      {} as any,
      createToken(),
    );

    expect(onRunning).toHaveBeenCalledOnce();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("calls onDone even when formatting fails", async () => {
    vi.mocked(mago.format).mockRejectedValue(new Error("crash"));

    const onDone = vi.fn();
    const provider = createFormattingProvider(
      () => "/bin/mago",
      () => "/workspace",
      () => undefined,
      () => undefined,
      vi.fn(),
      onDone,
    );

    // The provider should handle the error internally
    await expect(
      provider.provideDocumentFormattingEdits(
        mockDoc as any,
        {} as any,
        createToken(),
      ),
    ).rejects.toThrow();

    expect(onDone).toHaveBeenCalledOnce();
  });
});
