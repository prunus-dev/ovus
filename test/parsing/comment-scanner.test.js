import { expect } from "chai";
import { describe, it, before, afterEach } from "mocha";
import { CommentScanner } from "../../lib/parsing/comment-scanner.js";

const simpleHTML = `
<body>
  <!-- thing class="hi" -->
</body>
`.trim();

const stringHTML = `
<body>
  <thing text="<!-- not actually a comment -->"></thing>
  <thing text="also escaped \\" quotes \\" \\\\ "></thing>
  <!-- thing class="hi" -->
</body>
`.trim();

const exampleHTML = {
  text: simpleHTML,
  commentCount: 1,
  segments: [
    { comment: false, text: "<body>\n  " },
    { comment: true, text: '<!-- thing class="hi" -->' },
    { comment: false, text: "\n</body>" },
  ],
};

const exampleStringHTML = {
  text: stringHTML,
  commentCount: 1,
  segments: [
    {
      comment: false,
      text:
        '<body>\n  <thing text="<!-- not actually a comment -->"></thing>\n' +
        // eslint-disable-next-line no-useless-escape
        '  <thing text="also escaped \" quotes \" \\ "></thing>\n  ',
    },
    { comment: true, text: '<!-- thing class="hi" -->' },
    { comment: false, text: "\n</body>" },
  ],
};

describe("properties:", function () {
  before(function () {
    this.scanner = new CommentScanner(exampleHTML.text);
  });

  this.afterEach(function () {
    this.scanner.reset();
  });

  it("@text should return scanner text", function () {
    expect(this.scanner.text).to.equal(exampleHTML.text);
  });

  it("@position should return 0 before scan", function () {
    expect(this.scanner.position).to.equal(0);
  });

  it("@position should return text.length after scan", function () {
    this.scanner.scan();
    expect(this.scanner.position).to.equal(exampleHTML.text.length);
  });

  it("@segments should return [] before scan", function () {
    expect(this.scanner.segments).to.deep.equal([]);
  });

  it("@segments should have 3 elements for HTML with one comment", function () {
    this.scanner.scan();
    expect(this.scanner.segments.length).to.equal(exampleHTML.segments.length);
  });

  it("@segments should equal HTML split by comment after scan", function () {
    this.scanner.scan();
    expect(this.scanner.segments).to.deep.equal(exampleHTML.segments);
  });
});

describe("methods:", function () {
  before(function () {
    this.scanner = new CommentScanner(exampleHTML.text);
  });

  afterEach(function () {
    this.scanner.reset();
  });

  describe("reset()", function () {
    it("should reset the scanner state", function () {
      this.scanner.scan();
      this.scanner.reset();

      expect(this.scanner.position).to.equal(0);
      expect(this.scanner.segments).to.deep.equal([]);
    });
  });
  describe("commentNext()", function () {
    it("should return true if a comment is next", function () {
      const commentScanner = new CommentScanner("<!-- html comment -->");

      expect(commentScanner.commentNext()).to.be.true;
    });

    it("should return false otherwise", function () {
      expect(this.scanner.commentNext()).to.be.false;
    });
  });

  describe("scan()", function () {
    it("should not separate without HTML comments", function () {
      const noCommentHTML = "<body></body>";
      const noCommentScanner = new CommentScanner(noCommentHTML);
      noCommentScanner.scan();

      expect(noCommentScanner.segments).to.deep.equal([
        { comment: false, text: noCommentHTML },
      ]);
    });

    it("should separate HTML by comments", function () {
      this.scanner.scan();

      expect(this.scanner.segments).to.deep.equal(exampleHTML.segments);
    });

    it("should work with quotes (ignore quoted comments, consider escapes)", function () {
      const stringScanner = new CommentScanner(exampleStringHTML.text);

      stringScanner.scan();

      expect(stringScanner.segments).to.deep.equal(exampleStringHTML.segments);
    });
  });
});
