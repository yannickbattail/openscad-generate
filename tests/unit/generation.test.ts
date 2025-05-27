import { describe, expect, it } from "vitest";
import { getOpenscadOptions } from "../../src/generation.js";

describe("generation", () => {
  it("getOpenscadOptions", () => {
    const openScad = getOpenscadOptions();
    expect(openScad).toMatchSnapshot();
  });
});
