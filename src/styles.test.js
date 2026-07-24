import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(`${process.cwd()}/src/styles.css`, "utf8");

describe("responsive layout breakpoints", () => {
  it("uses the mobile shell for narrow screens and short landscape phones", () => {
    expect(styles).toContain(
      "@media (max-width: 767px), (max-height: 500px) and (max-width: 900px)"
    );
    expect(styles).toMatch(/@media \(max-width: 767px\)[\s\S]*?\.sidebar\s*{\s*display: none;/);
    expect(styles).toMatch(/@media \(max-width: 767px\)[\s\S]*?\.mobile-tabbar\s*{[\s\S]*?display: grid;/);
  });
});
