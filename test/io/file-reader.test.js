import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { describe, it } from "mocha";
import { FileReader } from "../../lib/io/file-reader.js";
import { readFile } from "node:fs/promises";
import * as path from "path";

use(chaiAsPromised);

const egHTML = {
  name: "eg-button",
  path: path.resolve(import.meta.dirname, "eg-button.html"),
};
egHTML.content = await loadFile(egHTML.path);

const egJS = {
  name: "eg-button-module",
  path: path.resolve(import.meta.dirname, "eg-button-module.js"),
};
egJS.content =
  "<button>\n" + '  <!-- @button-item prop="value" -->\n' + "</button>";

const egJSLiteral = {
  name: "eg-button-literal",
  path: path.resolve(import.meta.dirname, "eg-button-literal.js"),
};
egJSLiteral.content =
  "<button>\n" + '  <!-- @button-item prop="value" -->\n' + "</button>";

const egJSExportless = path.resolve(import.meta.dirname, "eg-no-export.js");

const defaultBlacklist = ["**/*.test.js"];

async function loadFile(name) {
  const fileBuffer = await readFile(name);
  const content = fileBuffer.toString("utf-8");

  return content;
}

describe("FileReader", function () {
  describe("properties:", function () {
    it("@path should return an array of path strings", function () {
      const egPath = "example";
      const reader = new FileReader(egPath);

      expect(reader.path).to.deep.equal([egPath]);
    });

    it("@path should return an array of multiple path strings", function () {
      const egPath = ["example", "example2"];
      const reader = new FileReader(egPath);

      expect(reader.path).to.deep.equal(egPath);
    });

    it("@blacklist to return an array of blacklist glob strings", function () {
      const egPath = "example";
      const blacklist = ["1", "2", "3"];
      const reader = new FileReader(egPath, { blacklist });

      expect(reader.blacklist).to.deep.equal(blacklist);
    });

    it("@blacklist to be empty by default", function () {
      const egPath = "example";
      const reader = new FileReader(egPath);

      expect(reader.blacklist).to.be.empty;
    });

    it("@whitelist to return an array of whitelist glob strings", function () {
      const egPath = "example";
      const whitelist = ["1", "2", "3"];
      const reader = new FileReader(egPath, { whitelist });

      expect(reader.whitelist).to.deep.equal(whitelist);
    });

    it("@whitelist to be empty by default", function () {
      const egPath = "example";
      const reader = new FileReader(egPath);

      expect(reader.whitelist).to.be.empty;
    });

    it("@htmlExtensions to return an array of html file extensions", function () {
      const egPath = "example";
      const htmlExtensions = [".html", ".xhtml"];
      const reader = new FileReader(egPath, { htmlExtensions });

      expect(reader.htmlExtensions).to.deep.equal(htmlExtensions);
    });

    it("@htmlExtensions to be ['.html'] by default", function () {
      const egPath = "example";
      const reader = new FileReader(egPath);

      expect(reader.htmlExtensions).to.deep.equal([".html"]);
    });

    it("@jsExtensions to return an array of html file extensions", function () {
      const egPath = "example";
      const jsExtensions = [".js", ".cjs", ".mjs"];
      const reader = new FileReader(egPath, { jsExtensions });

      expect(reader.jsExtensions).to.deep.equal(jsExtensions);
    });

    it("@jsExtensions to be ['.js'] by default", function () {
      const egPath = "example";
      const reader = new FileReader(egPath);

      expect(reader.jsExtensions).to.deep.equal([".js"]);
    });
  });

  describe("methods:", function () {
    it("should read an HTML template file", async function () {
      const reader = new FileReader(egHTML.path, {
        blacklist: defaultBlacklist,
      });

      const files = await reader.loadFiles();

      expect(files.length).to.equal(1);

      const loadedTemplate = files[0];

      expect(loadedTemplate).to.deep.equal({
        name: egHTML.name,
        content: egHTML.content,
      });
    });

    it("should read a JS template file (default fn)", async function () {
      const reader = new FileReader(egJS.path, {
        blacklist: defaultBlacklist,
      });
      const files = await reader.loadFiles();

      expect(files.length).to.equal(1);

      const loadedTemplate = files[0];

      expect(loadedTemplate.content).to.be.a("function");

      loadedTemplate.content = loadedTemplate.content();

      expect(loadedTemplate).to.deep.equal({
        name: egJS.name,
        content: egJS.content,
      });
    });

    it("should read a JS template file (default string)", async function () {
      const reader = new FileReader(egJSLiteral.path, {
        blacklist: defaultBlacklist,
      });
      const files = await reader.loadFiles();

      expect(files.length).to.equal(1);

      const loadedTemplate = files[0];

      expect(loadedTemplate.content).to.be.a("string");

      expect(loadedTemplate).to.deep.equal({
        name: egJSLiteral.name,
        content: egJSLiteral.content,
      });
    });

    it("should read multiple mixed HTML and JS templates", async function () {
      const reader = new FileReader("./test/io/*.{html,js}", {
        blacklist: [...defaultBlacklist, "**/*/eg-no-export.js"],
      });

      const files = await reader.loadFiles();

      // eg-button.html, eg-button-module.js, eg-button-literal.js
      expect(files.length).to.equal(3);
    });

    it("should throw an error for JS template without default export", async function () {
      const reader = new FileReader(egJSExportless);

      expect(reader.loadFiles()).to.eventually.throw;
    });

    it("should throw for detected template non-HTML/JS file", function () {
      const reader = new FileReader("./test/io/*.poop");

      expect(reader.loadFiles()).to.eventually.throw;
    });

    it("should not throw for file with alternative extension", function () {
      const reader = new FileReader("./test/io/*.poop", {
        htmlExtensions: [".poop"],
      });

      expect(reader.loadFiles()).to.eventually.not.throw;
    });

    it("should properly use whitelist to add possibly ignored files", async function () {
      const reader = new FileReader("./test/io/*.{js,html}", {
        blacklist: [...defaultBlacklist, "**/*/eg-no-export.js"],
        whitelist: ["./test/io/*.poop"],
        htmlExtensions: [".html", ".poop"],
      });

      const files = await reader.loadFiles();

      const hasWhitelistedFile = files.some(
        (file) => file.name === "eg-poop-template",
      );

      expect(hasWhitelistedFile).to.be.true;
    });

    it("should have whitelist ignore already matched files", async function () {
      const reader = new FileReader("./test/io/*.{js,html}", {
        blacklist: [...defaultBlacklist, "**/*/eg-no-export.js"],
        whitelist: ["./test/io/eg-button-*.js"],
        htmlExtensions: [".html", ".poop"],
      });

      const files = await reader.loadFiles();

      // eg-button.html, eg-button-module.js, eg-button-literal.js
      // should not "double-load" eg-button-module.js or eg-button-literal.js
      expect(files.length).to.equal(3);
    });
  });
});
