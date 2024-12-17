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

describe("CommentScanner", function () {
  describe("constructor:", function () {
    it("should take a string without throwing", function () {
      expect(() => new CommentScanner("some text")).to.not.throw();
    });

    it("should start empty for no argument", function () {
      const emptyScanner = new CommentScanner();

      expect(emptyScanner.text).to.be.null;
      expect(emptyScanner.position).to.equal(0);
      expect(emptyScanner.segments).to.deep.equal([]);
    });

    it("should throw on non-string arguments", function () {
      const cscan = (value) => () => new CommentScanner(value);

      expect(cscan(1)).to.throw(TypeError);
      expect(cscan(true)).to.throw(TypeError);
      expect(cscan({})).to.throw();
    });
  });

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

    it("@text should return null before load", function () {
      const emptyScanner = new CommentScanner();
      expect(emptyScanner.text).to.be.null;
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
      expect(this.scanner.segments.length).to.equal(
        exampleHTML.segments.length,
      );
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

    describe("load()", function () {
      it("should set the text to the given value", function () {
        const newText = "new text";
        const scanner = new CommentScanner("dummy text");

        scanner.load(newText);
        expect(scanner.text).to.equal(newText);
      });

      it("should reset the scanner state on load", function () {
        const newText = "new text";
        const scanner = new CommentScanner("dummy text");

        scanner.load(newText);
        expect(scanner.position).to.equal(0);
        expect(scanner.segments).to.deep.equal([]);
      });

      it("should throw on non-string argument", function () {
        const scanner = new CommentScanner();
        const load = (input) => () => scanner.load(input);

        expect(load(null)).to.throw();
        expect(load(undefined)).to.throw();
        expect(load(1)).to.throw();
        expect(load(false)).to.throw();
        expect(load({})).to.throw();
      });
    });

    describe("scan()", function () {
      it("should not separate without HTML comments", function () {
        const noCommentHTML = "<body></body>";
        const noCommentScanner = new CommentScanner(noCommentHTML);
        const segments = noCommentScanner.scan();

        expect(segments).to.deep.equal([
          { comment: false, text: noCommentHTML },
        ]);
      });

      it("should separate HTML by comments", function () {
        const segments = this.scanner.scan();
        expect(segments).to.deep.equal(exampleHTML.segments);
      });

      it("should work with quotes (ignore quoted comments, consider escapes)", function () {
        const stringScanner = new CommentScanner(exampleStringHTML.text);
        const segments = stringScanner.scan();

        expect(segments).to.deep.equal(exampleStringHTML.segments);
      });

      it("should output the same as @segments", function () {
        const segments = this.scanner.scan();
        expect(segments).to.equal(this.scanner.segments);
      });

      it("should throw if empty scanner (has null text)", function () {
        const emptyScanner = new CommentScanner();
        expect(() => emptyScanner.scan()).to.throw();
      });
    });
  });
});
