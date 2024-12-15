import { expect } from "chai";
import { describe, it } from "mocha";
import { readFileSync } from "node:fs";
import { CommentScanner } from "../../lib/parsing/comment-scanner.js";

const testHTML = readFileSync("./test/parsing/example.html", "utf-8");

describe("commentNext()", function () {
  it("should return true if a comment is next", function () {
    const scanner = new CommentScanner("<!-- html comment -->");

    expect(scanner.commentNext()).to.be.true;
  });
});

describe("scan()", function () {
  it("should separate HTML by comments", function () {
    const scanner = new CommentScanner(testHTML);

    scanner.scan();

    // TODO
  });
});
