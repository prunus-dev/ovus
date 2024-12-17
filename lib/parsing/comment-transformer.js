/**
 * Class that processes and transforms the text for an HTML comment into
 * the data contained within for a template.
 *
 * The intention is to provide a means of getting the template information
 * from a HTML comment, to aid in the transformation of each template comment
 * into the final HTML.
 *
 * The transformer has the following output interface:
 * - <name> is the string name of the template item to reference.
 * - <properties> is an array containing { key: val } objects for each property
 *   stated.
 */
class CommentTransformer {
  /** @type {string?} */
  #text;
  /** @type {number} */
  #pos;
  /** @type {object?} */
  #templateData;

  /*
		HTML Spec
		(https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name)
		notes that \u10000-\uEFFFF are also valid name tokens per
		the EBNF given for custom element names, but JS regex and strings
		do not support past \uFFFF and I don't care to find a way around
		that since this only vaguely mimics HTML name specs.
	*/
  static #templateNameStart = "[a-z]";

  static #templateNameChar =
    "[a-z:_0-9." +
    "\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D" +
    "\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF" +
    "\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD" +
    "]";

  static #templateName = new RegExp(
    CommentTransformer.#templateNameStart +
      CommentTransformer.#templateNameChar +
      "*",
    "gui",
  );

  constructor(comment = null) {
    this.#text = null;
    this.#pos = 0;
    this.#templateData = null;

    if (comment != null) {
      this.load(comment);
    }
  }

  /**
   * Returns the text loaded into the transformer.
   * @return {string?} The loaded text; null if nothing loaded.
   */
  get text() {
    return this.#text;
  }

  /**
   * Returns the current position of the scanner used in the transformer.
   * @return {number} The scanner position index.
   */
  get position() {
    return this.#pos;
  }

  /**
   * Returns the data loaded for the template found by the transformer.
   * @return {object?} An object containing the template information; null
   *                   if transformation not done yet.
   */
  get templateData() {
    return this.#templateData;
  }

  /**
   * Resets the CommentTransformer to the initial state for the loaded comment.
   */
  reset() {
    this.#pos = 0;
    this.#templateData = null;
  }

  /**
   * Loads the given comment string into the transformer, to prepare for
   * transformation.
   *
   * @param {string} comment The comment text to load into the transformer.
   * @throws {TypeError} If the comment is not a string.
   */
  load(comment) {
    if (!(typeof comment === "string") && !(comment instanceof String)) {
      throw new TypeError("CommentTransformer requires a string when loading.");
    }

    this.#text = comment;
    this.reset();
  }

  /**
   * Checks whether the scanner is not at end of string (EOS).
   *
   * @returns {boolean} Whether the scanner is not at EOS.
   */
  #notEOS() {
    return this.#pos < this.#text.length;
  }

  /**
   * Returns the character found in the comment text at the current
   * scanner position.
   *
   * @returns {string} The current character at the scanner position.
   */
  #currentChar() {
    return this.#text.charAt(this.#pos);
  }

  /**
   * Returns the portion of the comment text starting at the current
   * scanner position.
   *
   * @returns {string} The slice of the text from the current position.
   */
  #currentText() {
    return this.#text.slice(this.#pos);
  }

  /**
   * Scans and skips through any empty space found from the current
   * scanner position.
   */
  #skipSpace() {
    // Scan character-by-character until non-space is hit.
    while (this.#notEOS()) {
      const currentChar = this.#currentChar();

      if (!currentChar.match(/\s/)) {
        break;
      }

      this.#pos++;
    }
  }

  /**
   * Scans the HTML comment opening symbol (<!--) that should be
   * at the beginning of a template comment.
   *
   * @throws {Error} If the comment does not start with a "<!--".
   *                 This shouldn't happen, as this should be fed text already
   *                 identified as comments, but just in case.
   */
  #scanCommentOpen() {
    if (!this.#text.startsWith("<!--")) {
      throw new Error(
        "Template comment needs to start with HTML comment " +
          "opening (<!--).",
      );
    }

    this.#pos = 4; // 4 == "<!--".length
  }

  /**
   * Checks whether the comment is part of a template.
   * A template comment has the value for the template marked with an
   * @-sigil; therefore, a comment that doesn't start with @ cannot be
   * a template comment.
   *
   * @param {string} comment The trimmed comment to check.
   * @returns {boolean} Whether or not the comment is marked as a template item.
   */
  #isTemplateComment() {
    return this.#text.startsWith("@");
  }

  /**
   * Skips over the template sigil (@).
   * Intended to be used after isTemplateComment() to verify that the
   * sigil exists.
   */
  #skipTemplateSigil() {
    this.#pos++; // Template sigil "@" is single character.
  }

  /**
   * Scans the text from the scanner position and returns a scanned
   * template name, if valid.
   *
   * @see {CommentTransformer.#templateName}
   * @returns {string} The template name found.
   * @throws {Error} If invalid template name at scanner position.
   */
  #scanTemplateName() {
    const currentText = this.#currentText();
    const nameMatch = currentText.match(CommentTransformer.#templateName);

    if (nameMatch == null) {
      throw new Error(
        "Invalid template name.\n" + `(${this.#text}), character ${this.#pos}.`,
      );
    }

    // Get name from match and update scanner position.
    const name = nameMatch[0];
    this.#pos += name.length;

    return name;
  }

  /**
   * Scans the text from the scanner position and returns a scanned
   * property name, if valid.
   *
   * @see {CommentTransformer.#templateName}
   * @returns {string} The property name found.
   * @throws {Error} If invalid property name at scanner position.
   */
  #scanPropertyName() {
    const currentText = this.#currentText();
    const nameMatch = currentText.match(CommentTransformer.#templateName);

    if (nameMatch == null) {
      throw new Error(
        "Invalid template property name.\n" +
          `(${this.#text}), character ${this.#pos}.`,
      );
    }

    // Get name from match and update scanner position.
    const name = nameMatch[0];
    this.#pos += name.length;

    return name;
  }

  /**
   * Scans and skips over the equality delimiter (=) that is placed
   * between a template property name and its corresponding value.
   *
   * @throws {Error} If there is not an "=" found.
   */
  #skipPropertyEquals() {
    if (this.#currentChar() !== "=") {
      throw new Error(
        'Template property must have "=" between the name and the value.\n' +
          `(${this.#text}), character ${this.#pos}.`,
      );
    }

    this.#pos++; // Template property "=" is single character.
  }

  /**
   * Scans the quoted text for a property value.
   *
   * @returns {string} The value for the property.
   * @throws {Error} If the quotes are missing from the property.
   */
  #scanPropertyValue() {
    const value = "";

    // Property value must be quoted, and so start with quote.
    if (!['"', "'"].includes(this.currentChar())) {
      throw new Error(
        "Template property value must be quoted.\n" +
          `(${this.#text}), character ${this.#pos}.`,
      );
    }

    // Record type of quote used in opening of value, to use in
    // detecting end quote.
    const openQuote = this.currentChar();
    this.#pos++;

    while (this.#notEOS()) {
      // TODO: Scan until end quote, considering escapes.
    }

    return value;
  }

  /**
   * Scans a template property for its name and value.
   *
   * @returns {string[]} An array [name, value] of the property name and value.
   */
  #scanProperty() {
    const name = this.#scanPropertyName();

    this.#skipSpace();
    this.#skipPropertyEquals();
    this.#skipSpace();

    const value = this.#scanPropertyValue();

    return [name, value];
  }

  /**
   * Scans the comment, extracts the template data if a template comment, and
   * returns an object of the data.
   *
   * @returns {object?} An object of template data; null if not a template.
   */
  transform() {
    this.#scanCommentOpen();
    this.#skipSpace();

    if (!this.#isTemplateComment()) {
      return null;
    }

    this.#skipTemplateSigil();
    const name = this.#scanTemplateName();

    this.#skipSpace();

    // TODO: Loop and scan properties, saving them as name:value pairs in the
    //     | templateData object.
  }
}

export default CommentTransformer;
export { CommentTransformer as CommentTransformer };
