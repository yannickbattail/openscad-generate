import { describe, expect, it } from "vitest";

import { updateConfigFile } from "../../src/configuration/update.js";

describe("updateConfigFile", () => {
  it("should return existing content unchanged when reference has no extra keys", () => {
    const existing = "a: 1\nb: 2\n";
    const reference = "a: 1\nb: 2\n";
    const result = updateConfigFile(existing, reference);
    expect(result).toContain("a: 1");
    expect(result).toContain("b: 2");
  });

  it("should add missing top-level keys from reference", () => {
    const existing = "a: 1\n";
    const reference = "a: 1\nb: 2\nc: 3\n";
    const result = updateConfigFile(existing, reference);
    expect(result).toContain("a: 1");
    expect(result).toContain("b: 2");
    expect(result).toContain("c: 3");
  });

  it("should preserve existing values and not overwrite them", () => {
    const existing = "a: 1\nb: original\n";
    const reference = "a: 99\nb: overwritten\nc: new\n";
    const result = updateConfigFile(existing, reference);
    expect(result).toContain("a: 1");
    expect(result).toContain("b: original");
    expect(result).toContain("c: new");
    expect(result).not.toContain("a: 99");
    expect(result).not.toContain("b: overwritten");
  });

  it("should add missing nested keys inside maps", () => {
    const existing = "nested:\n  x: 10\n";
    const reference = "nested:\n  x: 10\n  y: 20\n";
    const result = updateConfigFile(existing, reference);
    expect(result).toContain("x: 10");
    expect(result).toContain("y: 20");
  });

  it("should add deeply nested missing keys", () => {
    const existing = "level1:\n  level2:\n    a: 1\n";
    const reference = "level1:\n  level2:\n    a: 1\n    b: 2\n  newKey: hello\n";
    const result = updateConfigFile(existing, reference);
    expect(result).toContain("a: 1");
    expect(result).toContain("b: 2");
    expect(result).toContain("newKey: hello");
  });

  it("should preserve comments from reference when adding missing keys", () => {
    const existing = "a: 1\n";
    const reference = "a: 1\n### comment for b\nb: 2\n";
    const result = updateConfigFile(existing, reference);
    expect(result).toContain("a: 1");
    expect(result).toContain("b: 2");
    expect(result).toContain("### comment for b");
  });

  it("should preserve comments on nested missing keys", () => {
    const existing = "options:\n  backend: Manifold\n";
    const reference = "options:\n  backend: Manifold\n  ### Stop on the first warning\n  hardwarnings: false\n";
    const result = updateConfigFile(existing, reference);
    expect(result).toContain("backend: Manifold");
    expect(result).toContain("hardwarnings: false");
    expect(result).toContain("### Stop on the first warning");
  });

  it("should handle empty existing content", () => {
    const existing = "{}\n";
    const reference = "a: 1\nb: 2\n";
    const result = updateConfigFile(existing, reference);
    expect(result).toContain("a: 1");
    expect(result).toContain("b: 2");
  });

  it("should throw on invalid YAML document structure", () => {
    const existing = "- item1\n- item2\n";
    const reference = "a: 1\n";
    expect(() => updateConfigFile(existing, reference)).toThrow("Invalid YAML document structure");
  });

  it("should throw when reference is a sequence instead of a map", () => {
    const existing = "a: 1\n";
    const reference = "- item1\n- item2\n";
    expect(() => updateConfigFile(existing, reference)).toThrow("Invalid YAML document structure");
  });
});
