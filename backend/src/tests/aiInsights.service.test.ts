import { describe, expect, it } from "vitest";

import { __testing } from "../services/aiInsights.service.js";

describe("aiInsights.service extractJson", () => {
  it("extracts JSON from mixed content", () => {
    const text = 'Here is result: {"summary":"ok"} Thanks';
    const json = __testing.extractJson(text);
    expect(json).toBe('{"summary":"ok"}');
  });

  it("throws when JSON is missing", () => {
    expect(() => __testing.extractJson("no json")).toThrow(
      "Gemini response missing JSON",
    );
  });
});
