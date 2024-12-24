import { glob } from "glob";
import { readFile } from "node:fs/promises";

class FileReader {
  /** @type {string} */
  #path;

  constructor(path) {
    this.#path = path;
  }

  /**
   * Asynchronously gets all files specified by the given file path glob, and
   * then reads each file to get their content.
   *
   * @returns {object[]} A list of every loaded file in a { name, content }
   *                     object.
   * @async
   * @throws {Error} On file reading error.
   */
  async loadFiles() {
    // Get file names matching supplied file path glob.
    // Ignore node modules by default, just in case.
    const fileNames = await glob(this.#path, {
      ignore: "node_modules/**",
      nodir: true,
    });

    const files = [];

    // Read and add file content.
    for (const name of fileNames) {
      const fileBuffer = await readFile(name);
      const content = fileBuffer.toString("utf-8");

      files.push({ name, content });
    }

    return files;
  }

  /**
   * Returns the file path given to the reader.
   * @return {string} The file path.
   */
  get path() {
    return this.#path;
  }
}

export default FileReader;
export { FileReader as FileReader };
