import { expect } from "chai";
import { describe, it } from "mocha";
import { CommentTransformer } from "../../lib/parsing/comment-transformer.js";

const exampleComment = '<!-- @button class="rounded p-1 m-2 bg-light" -->';

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

    it("@position should return text.length after transform", function () {
      const text = "<!-- @button -->";
      const transformer = new CommentTransformer(text);
      transformer.transform();

      expect(transformer.position).to.equal(text.length);
    });

    it("@templateData should return null before transform", function () {
      const emptyTransformer = new CommentTransformer();
      expect(emptyTransformer.templateData).to.be.null;
    });

    it("@templateData should return an expected object after transform", function () {
      const transformer = new CommentTransformer(
        '<!-- @button class="stuff" -->',
      );
      const outputData = { name: "button", properties: [{ class: "stuff" }] };

      transformer.transform();
      expect(transformer.templateData).to.deep.equal(outputData);
    });
  });

  describe("methods:", function () {
    describe("reset()", function () {
      it("should reset scanner state", function () {
        const transformer = new CommentTransformer("<!-- @button -->");

        transformer.transform();
        transformer.reset();

        expect(transformer.position).to.equal(0);
        expect(transformer.templateData).to.be.null;
      });

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

    describe("transform()", function () {
      it("transforms with only template name", function () {
        const transformer = new CommentTransformer("<!-- @button -->");
        const outputData = { name: "button", properties: [] };

        expect(transformer.transform()).to.deep.equal(outputData);
      });

      it("transforms with one property", function () {
        const transformer = new CommentTransformer(
          "<!-- @button class='p-2' -->",
        );
        const outputData = { name: "button", properties: [{ class: "p-2" }] };

        expect(transformer.transform()).to.deep.equal(outputData);
      });

      it("transforms with multiple properties (2-10)", function () {
        const props = [
          "x-on:click",
          "x-on:hover",
          "x-on:focus",
          "x-on:unfocus",
          "x-on:click.shift",
          "x-on:input",
          "x-on:custom-event",
          "x-on:keyup",
          "x-on:keydown",
          "x-on:submit",
        ];

        // Loop from [2,10] properties and test each one for expected output.
        for (let x = 2; x < props.length; x++) {
          const templateProps = props.slice(0, x);

          const outputData = { name: "button", properties: [] };
          templateProps.forEach(
            (prop, index) =>
              (outputData.properties[index] = { [prop]: "doThing()" }),
          );

          const templatePropText = templateProps
            .map((prop) => {
              return `${prop}='doThing()'`;
            })
            .join(" ");

          const template = `<!-- @button ${templatePropText} -->`;
          const transformer = new CommentTransformer(template);

          expect(transformer.transform()).to.deep.equal(outputData);
        }
      });

      it("transforms with escaped quotes in property text", function () {
        const transformer = new CommentTransformer(
          '<!-- @button prop="some \\"quoted\\" thing" -->',
        );
        const outputData = {
          name: "button",
          properties: [{ prop: 'some "quoted" thing' }],
        };

        expect(transformer.transform()).to.deep.equal(outputData);
      });

      it("should transform with extra space characters", function () {
        const transformer = new CommentTransformer(
          "<!--    @button\tprop='stuff'  \n   \t\n-->",
        );
        const outputData = { name: "button", properties: [{ prop: "stuff" }] };

        expect(transformer.transform()).to.deep.equal(outputData);
      });

      it("should return null if not a template comment (missing @)", function () {
        const transformer = new CommentTransformer("<!-- just a comment -->");

        expect(transformer.transform()).to.be.null;
      });

      it("should throw if no <!-- at beginning of comment", function () {
        const transformer = new CommentTransformer("not a comment -->");

        expect(() => transformer.transform()).to.throw();
      });

      it("should throw if no --> at end of comment", function () {
        const transformer = new CommentTransformer("<!-- @button");
        expect(() => transformer.transform()).to.throw();

        transformer.load("<!-- @button class='hi'");
        expect(() => transformer.transform()).to.throw();
      });

      it("should throw if no = for property", function () {
        // Test no "=" or value in general.
        const transformer = new CommentTransformer("<!-- @button class -->");
        expect(() => transformer.transform()).to.throw();

        // Also test if no "=" between prop name and value
        transformer.load('<!-- @button class"value"');
        expect(() => transformer.transform()).to.throw();
      });

      it("should throw if no open quote for property value", function () {
        // Test no quotes.
        const transformer = new CommentTransformer("<!-- @button class=hi -->");
        expect(() => transformer.transform()).to.throw();

        // Also test literally only end quote.
        transformer.load("<!-- @button class=hi'");
        expect(() => transformer.transform()).to.throw();
      });

      it("should throw if no end quote for property value", function () {
        // Test no quotes.
        const transformer = new CommentTransformer("<!-- @button class=hi -->");
        expect(() => transformer.transform()).to.throw();

        // Also test literally only end quote.
        transformer.load("<!-- @button class='hi");
        expect(() => transformer.transform()).to.throw();
      });

      it("should throw on mismatched quotes (\" vs ')", function () {
        const transformer = new CommentTransformer(
          "<!-- @button class=\"hi' -->",
        );
        expect(() => transformer.transform()).to.throw();
      });

      it("should throw on invalid template name", function () {
        const transformer = new CommentTransformer("<!-- @$badname -->");

        expect(() => transformer.transform()).to.throw();
      });

      it("should throw on invalid template property name", function () {
        const transform = new CommentTransformer("<!-- @button $class='x'");
        expect(() => transform.transform()).to.throw();
      });
    });
  });
});
