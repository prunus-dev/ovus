import { expect } from "chai";
import { describe, it, before } from "mocha";
import { CommentTransformer } from "../../lib/parsing/comment-transformer.js";

const exampleComment = '<!-- @button class="rounded p-1 m-2 bg-light" -->';
const exampleData = {
  name: "button",
  properties: [{ class: "rounded p-1 m-2 bg-light" }],
};

describe("CommentTransformer", function () {
  describe("properties:", function () {
    it("@text should return loaded text", function () {
      const exampleText = "some text";
      const transformer = new CommentTransformer(exampleText);
      expect(transformer.text).to.equal(exampleText);
    });

    it("@text should be null before loading", function () {
      const emptyTransformer = new CommentTransformer();
      expect(emptyTransformer.text).to.be.null;
    });

    it("@position should be 0 before transform", function () {
      const emptyTransformer = new CommentTransformer();
      expect(emptyTransformer.position).to.equal(0);
    });

    // TODO: @position should return text.length after transform

    it("@templateData should return null before transform", function () {
      const emptyTransformer = new CommentTransformer();
      expect(emptyTransformer.templateData).to.be.null;
    });

    // TODO: @templateData should return object with values after transform
  });
  describe("methods:", function () {
    before(function () {
      this.transformer = new CommentTransformer();
    });

    describe("reset()", function () {
      // TODO: it should reset scanner state.
      //     | (implement after transform(), to check non-initial state)

      it("should reset with no loaded text", function () {
        const emptyTransformer = new CommentTransformer();
        emptyTransformer.reset();

        expect(emptyTransformer.position).to.equal(0);
        expect(emptyTransformer.templateData).to.be.null;
      });
    });

    describe("load()", function () {
      it("should load a string into the transformer", function () {
        const emptyTransformer = new CommentTransformer();
        emptyTransformer.load(exampleComment);

        expect(emptyTransformer.text).to.equal(exampleComment);
      });

      it("should throw on non-string argument", function () {
        const emptyTransformer = new CommentTransformer();
        const loading = (input) => () => emptyTransformer.load(input);

        expect(loading(1)).to.throw();
        expect(loading(true)).to.throw();
        expect(loading({})).to.throw();
        expect(loading(null)).to.throw();
        expect(loading(undefined)).to.throw();
      });
    });
  });
});
