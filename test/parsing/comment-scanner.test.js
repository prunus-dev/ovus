import { expect } from "chai";
import { describe, it } from "mocha";
import { readFileSync } from "node:fs";
import { CommentScanner } from "../../lib/parsing/comment-scanner.js";

const testHTML = readFileSync("./test/parsing/example.html", "utf-8");

describe("text", function () {
  it("should return the scanner text", function () {
    const scanner = new CommentScanner(testHTML);

    expect(scanner.text).to.equal(testHTML);
  });
});
