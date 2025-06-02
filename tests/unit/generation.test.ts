import { describe, expect, it } from "vitest";
import { getDefaultOpenscadOptions } from "../../src/generation.js";

describe("generation", () => {
  it("getOpenscadOptions", () => {
    const openScad = getDefaultOpenscadOptions();
    expect(openScad).toMatchSnapshot();
  });
});
