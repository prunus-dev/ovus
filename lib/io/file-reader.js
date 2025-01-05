import { glob } from "glob";
import { readFile } from "node:fs/promises";
import * as path from "node:path";
import { cwd } from "node:process";

class FileReader {
  /** @type {string[]} */
  #path;
  /** @type {string[]} */
  #blacklist;
  /** @type {string[]} */
  #whitelist;
  /** @type {string[]} */
  #htmlExtensions;
  /** @type {string[]} */
  #jsExtensions;

  // TODO: Make options an OvusOptions object when implemented.
  /**
   * Creates a FileReader object, which loads in files according to several
   * provided file path globs and then extracts the relevant content from them
   * for Ovus templates.
   *
   * @param {string|string[]} path The file path glob(s) to load from.
   * @param {{
   *  blacklist: string[]?,
   * 	whitelist: string[]?,
   * 	htmlExtensions: string[]?,
   * 	jsExtensions: string[]?
   * }} options An object containing several options detailing
   *            how to load and read the files.
   */
  constructor(
    path,
    options = {
      blacklist: [],
      whitelist: [],
      htmlExtensions: [".html"],
      jsExtensions: [".js"],
    },
  ) {
    // Path can be either string or string[]; convert to string[] if needed.
    this.#path = Array.isArray(path) ? path : [path];

    this.#blacklist = options.blacklist || [];
    this.#whitelist = options.whitelist || [];
    this.#htmlExtensions = options.htmlExtensions || [".html"];
    this.#jsExtensions = options.jsExtensions || [".js"];
  }

  /**
   * Returns the list of file path globs to search for.
   *
   * @return {string[]} A list of file globs.
   */
  get path() {
    return this.#path;
  }

  /**
   * Returns the blacklist of file globs to always ignore.
   *
   * @return {string[]} A list of blacklist globs.
   */
  get blacklist() {
    return this.#blacklist;
  }

  /**
   * Returns the whitelist of file globs to always include.
   *
   * @return {string[]} A list of whitelist globs.
   */
  get whitelist() {
    return this.#whitelist;
  }

  /**
   * Returns the list of file extensions associated with Ovus HTML template
   * files.
   *
   * @return {string[]} A list of Ovus HTML extensions.
   */
  get htmlExtensions() {
    return this.#htmlExtensions;
  }

  /**
   * Returns the list of file extensions associated with Ovus JS template
   * files.
   *
   * @return {string[]} A list of Ovus JS extensions.
   */
  get jsExtensions() {
    return this.#jsExtensions;
  }

  /**
   * Creates a list of file globs to set to ignore.
   * @returns {string[]} The list of ignored globs.
   */
  #ignoredGlobs() {
    return [...this.#blacklist, "node_modules/**"];
  }

  /**
   * Creates a list of whitelisted files from the globs provided in the
   * {@link FileReader.whitelist} and inserts any new filenames into the
   * provided array of filenames.
   *
   * @param {string[]} filenameList The list of filenames to add to.
   */
  async #appendWhitelistFiles(filenameList) {
    const whitelistNames = await glob(this.#whitelist, {
      ignore: ["node_modules/**"],
      nodir: true,
    });

    // Loop through whitelist and add any new filenames.
    for (const name of whitelistNames) {
      if (filenameList.includes(name)) {
        continue;
      }

      filenameList.push(name);
    }
  }

  /**
   * Processes a given file path to get the name of the base file without
   * extensions.
   *
   * @param {string} name The filename to process.
   * @returns The name of the base file without extensions.
   */
  #baseFilename(name) {
    return path.parse(name).name;
  }

  /**
   * Asynchronously gets all files specified by the given file path glob, and
   * then reads each file to get their content.
   *
   * @returns {Promise<object[]>} A list of every loaded file in a
   *                              { name, content } object.
   * @async
   * @throws {Error} On file reading error.
   */
  async loadFiles() {
    // Get file names matching supplied file path glob.
    // Ignore node modules by default, just in case.
    const fileNames = await glob(this.#path, {
      ignore: this.#ignoredGlobs(),
      nodir: true,
    });

    this.#appendWhitelistFiles(fileNames);

    const files = [];

    // Read and add file content.
    for (const name of fileNames) {
      let content = null;

      if (this.#isFileHTML(name)) {
        content = await this.#processFileHTML(name);
      } else if (this.#isFileJS(name)) {
        content = await this.#processFileJS(name);
      } else {
        throw new Error(
          "Ovus template file must end with either " +
            `"${this.#htmlExtensions.join(", ")}" for HTML templates or ` +
            `"${this.#jsExtensions.join(", ")} for JS templates. ` +
            `Tried to read file "${name}". ` +
            // TODO: Come back when config property names are finalized.
            "If this is actually a template file, change your configuration " +
            "settings for the Ovus path, blacklist, whitelist, " +
            "htmlExtensions, or jsExtensions.",
        );
      }

      files.push({ name: this.#baseFilename(name), content });
    }

    return files;
  }

  /**
   * Reads a given JS file and gets the default export from it, which
   * is intended to be the template function or literal.
   *
   * @param {string} name The name of the JS file.
   * @returns {Promise<function|string>}	The default export template.
   * @async
   * @throws {Error} If no default export for JS template module.
   */
  async #processFileJS(name) {
    // Get the difference between the current working directory that the node
    // process is running in versus that of the file to be imported.
    const pathDifferential = path.relative(path.parse(name).dir, cwd());

    // Ensure that the relative path generated for the template file to be
    // imported uses POSIX file separators.
    // Import will actually throw an error if you use Windows ("\") separators
    // in a path.
    const posixModuleName = this.#posixPath(path.join(pathDifferential, name));

    const module = await import(posixModuleName);

    // Throw error if no default export to utilize for template.
    if (module.default == null) {
      throw new Error(
        "Ovus JS template file must have a default export, which Ovus uses " +
          `for the template. Problem file: "${name}".`,
      );
    }

    return module.default;
  }

  /**
   * Reads a given HTML file and gets the text from it.
   *
   * @param {string} name The name of the HTML file.
   * @returns {Promise<string>} The HTML text content from the file.
   * @async
   * @throws {Error} On file reading error.
   */
  async #processFileHTML(name) {
    const fileBuffer = await readFile(name);
    const content = fileBuffer.toString("utf-8");

    return content;
  }

  /**
   * Checks whether a given filename has an extension that would match the
   * pattern set in the Ovus options for an HTML template file.
   *
   * @param {string} name The file name to check.
   * @returns Whether the file name matches the settings to be counted as an
   *          HTML template file.
   */
  #isFileHTML(name) {
    return this.#htmlExtensions.some((extension) => name.endsWith(extension));
  }

  /**
   * Checks whether a given filename has an extension that would match the
   * pattern set in the Ovus options for a JS template file.
   *
   * @param {string} name The file name to check.
   * @returns Whether the file name matches the settings to be counted as a
   *          JS template file.
   */
  #isFileJS(name) {
    return this.#jsExtensions.some((extension) => name.endsWith(extension));
  }

  /**
   * Converts all file separators in the given file path to
   * POSIX file path separators ("/").
   *
   * @param {string} filename The filename path string to use.
   * @returns The filename path with separators converted to POSIX ("/")
   */
  #posixPath(filename) {
    return filename.replaceAll(path.sep, path.posix.sep);
  }
}

export default FileReader;
export { FileReader as FileReader };
