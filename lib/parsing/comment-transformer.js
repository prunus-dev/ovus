/**
 * Class that processes and transforms the text for an HTML comment into
 * the data contained within for a template.
 *
 * The intention is to provide a means of getting the template information
 * from a HTML comment, to aid in the transformation of each template comment
 * into the final HTML.
 *
 * The transformer has the following output interface:
 * - <value> is the string name of the template item to reference.
 * - <properties> is an array containing { key: val } objects for each property
 *   stated.
 */
class CommentTransformer {
  constructor() {}

  /**
   * Trims an HTML comment of its comment boundary symbols and any
   * whitespace around the inner content.
   *
   * @param {string} comment The comment to trim.
   * @returns {string} The comment with boundaries and whitespace trimmed.
   */
  #trimComment(comment) {
    return comment.slice("<!--".length, -"-->".length).trim();
  }

  /**
   * Checks whether the given trimmed comment is part of a template.
   * A template comment has the value for the template marked with a
   * @-sigil; therefore, a comment that doesn't start with @ cannot be
   * a template comment.
   *
   * @param {string} comment The trimmed comment to check.
   * @returns {boolean} Whether or not the comment is marked as a template item.
   */
  #isTemplateComment(comment) {
    return comment.startsWith("@");
  }

  /**
   * Gets the template value from the given comment text.
   *
   * @param {string} comment The HTML comment text to get the value from.
   * @returns {object} An object containing the value text and remaining text.
   */
  #extractValue(comment) {
    // note: slice(1) is to remove the "@" before the value name.
    const [value, remainder] = comment.slice(1).split(/\s/g, 1);
    return { value, remainder };
  }

  #noProperties(propertyText) {
    return propertyText == null || propertyText.trim() === "";
  }

  #getPropertyName(text) {
    let nameEnd = false;
    let name = "";
    let index = 0;

    while (!nameEnd) {
      const currentChar = text.charAt(index);

      // Property cannot have space in name.
      if (currentChar.match(/\s|['"/>]/)) {
        throw new Error(
          "Illegal character in template property name.\n" +
            `(${text}), character ${index + 1}`,
        );
      }
      // Equals sign marks end of property name.
      else if (char === "=") {
        nameEnd = true;
        // Set name equal to text before "=".
        name = text.slice(0, index - 1);
      }

      index++;
    }

    if (name === "") {
      throw new Error(
        "Template property name cannot be blank.\n" +
          `(${text}), character ${index + 1}`,
      );
    }

    return name;
  }

  #getPropertyValue(text) {
    const index = 0;

    // Property text needs to start with quote, single or double.
    if (!['"', "'"].includes(text.charAt(index))) {
      throw new Error(
        "Value for template property must start with a quote.\n" +
          `(${text}), character ${index + 1}`,
      );
    }
  }

  #getProperty(text) {
    const name = this.#getPropertyName(text);
    text = text.slice(name.length);

    const value = this.#getPropertyValue(text);

    // note: value.length + 2 to account for open/close quotes around prop.
    const newIndex = text.slice(value.length + 2);

    return [name, value, newIndex];
  }

  /**
   *
   * @param {string} propertyText The comment text for the properties
   */
  #extractProperties(propertyText) {}

  /**
   * Splits an HTML comment into relevant portions.
   *
   * @param {string} comment The comment to split up.
   * @return {object}
   */
  transform(comment) {
    const trimmedComment = this.#trimComment();

    // Short-circuit processing if not marked as a template comment.
    if (!this.#isTemplateComment(trimmedComment)) {
      return { value: null, properties: null };
    }

    const [value, propertyText] = this.#extractValue(trimmedComment);

    // Short-circuit if value-only template item.
    if (this.#noProperties(propertyText)) {
      return { value, properties: [] };
    }

    return { value, properties: undefined };
  }
}

export default CommentTransformer;
export { CommentTransformer as CommentTransformer };
