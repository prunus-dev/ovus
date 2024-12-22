/**
 * Class that scans a given string of text to:
 * - Scan HTML.
 * - Detect any comments within.
 * - Create an array where the HTML is separated by the comments, with each
 *   segment being either a comment or non-comment text.
 *
 * The intention is to provide an interface that allows for:
 * - Processing the comment text into usable data.
 * - Easily being able to re-insert a transformed comment while exactly
 *   matching the structure of the initial HTML text.
 *
 * The scanner has the following output interface:
 * {@link CommentScanner.segments} is an Array of objects with the structure
 * `{ comment: boolean, text: string }`
 */
class CommentScanner {
  /** @type {string?} */
  #text;
  /** @type {number} */
  #pos;
  /** @type {string[]} */
  #segments;

  /**
   * Create a CommentScanner instance with the given input text.
   *
   * @param {string?} text The text to scan for HTML comments.
   * @constructor
   * @throws {TypeError} If provided text is not a string.
   */
  constructor(text = null) {
    this.#pos = 0;
    this.#text = null;
    this.#segments = [];

    if (text != null) {
      this.load(text);
    }
  }

  /**
   * Returns the text loaded into the scanner.
   *
   * @return {string?} The scanner text; null if no text loaded.
   */
  get text() {
    return this.#text;
  }

  /**
   * Returns the current scanner position, which is the index of the
   * next character to be scanned.
   *
   * @return {number} The current scanner index.
   */
  get position() {
    return this.#pos;
  }

  /**
   * Returns the Array of segments compiled from scanning the given
   * text string.
   *
   * This string is split along any HTML comments found in the
   * text, as per the {@link CommentScanner.scan} method.
   *
   * @return {string[]}
   */
  get segments() {
    return this.#segments;
  }

  /**
   * Resets the scanner state.
   */
  reset() {
    this.#pos = 0;
    this.#segments = [];
  }

  /**
   * Checks the following text in the string at the current scanner position.
   *
   * @param {number} n How many characters to peek forward.
   * @returns {string} The next characters in the text, up to n characters.
   */
  #peek(n) {
    return this.#text.slice(this.#pos, this.#pos + n);
  }

  /**
   * Gets the rest of the text being scanned from the current position.
   *
   * @returns {string} A string containing the rest of the text from the
   *                   scanner position.
   */
  #rest() {
    return this.#text.slice(this.#pos);
  }

  /**
   * Checks whether or not a comment appears next in the text.
   *
   * @returns {boolean} Whether or not a comment appears next in the text.
   */
  #commentNext() {
    return this.#peek(4) === "<!--";
  }

  /**
   * Checks whether there is still text to scan, or if the EOS (end of string)
   * has been reached
   *
   * @returns {boolean} Whether the scanner has reached the end of the string.
   */
  #notEOS() {
    return this.#pos < this.#text.length;
  }

  /**
   * Scans the text at the current position for a comment.
   *
   * @returns {object} An object with information on a comment-scan attempt.
   */
  #scanComment() {
    const match = RegExp(/^<!--.*?-->/).exec(this.#rest());

    return match
      ? { text: match[0], newPos: this.#pos + match[0].length }
      : { text: null, newPos: null };
  }

  /**
   * Loads in the given text to the scanner, to prepare for scanning.
   *
   * @param {string} text HTML template text to load.
   * @throws {TypeError} If text is not a string.
   */
  load(text) {
    if (!(typeof text === "string") && !(text instanceof String)) {
      throw new TypeError("CommentScanner requires a string for the text.");
    }

    this.#text = text;
    this.reset();
  }

  /**
   * Scans the given text and separates it into segments, which are
   * split by instances of HTML comments.
   *
   * @returns {object[]} The segments of the scanned HTML; can also be retrieved
   *                     via {@link CommentScanner.segments}.
   */
  scan() {
    let currentSegment = "";
    let inString = false;
    let stringEscape = false;

    while (this.#notEOS()) {
      const currentChar = this.#text.charAt(this.#pos);

      // Character may be opening for comment.
      if (currentChar === "<" && !inString) {
        // If comment coming up, scan and push relevant segments.
        if (this.#commentNext()) {
          const comment = this.#scanComment();

          this.#segments.push({ comment: false, text: currentSegment });
          this.#segments.push({ comment: true, text: comment.text });

          // Update scanner and current segment for new segment.
          this.#pos = comment.newPos;
          currentSegment = "";

          continue;
        }
      }
      // Check string escape character.
      // If already escaped, then it is an actual \ character.
      // Otherwise, it is an escape and should not be counted.
      else if (currentChar === "\\") {
        if (stringEscape) {
          currentSegment += currentChar;
        }
        stringEscape = !stringEscape;

        this.#pos++;
        continue;
      }
      // Check quote and see if it's open, close, or escaped.
      else if (currentChar === '"' || currentChar === "'") {
        if (stringEscape) {
          stringEscape = false;
        } else {
          inString = !inString;
        }

        currentSegment += currentChar;
        this.#pos++;
        continue;
      }

      // Add character to segment and iterate along text.
      currentSegment += currentChar;
      this.#pos++;
    }

    // If there is a remaining segment, add it to list.
    if (currentSegment.length > 0) {
      this.#segments.push({ comment: false, text: currentSegment });
    }

    return this.#segments;
  }
}

export default CommentScanner;
export { CommentScanner as CommentScanner };
