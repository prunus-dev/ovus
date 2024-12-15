class CommentScanner {
	#text
	#pos
	#segments

	constructor(text) {
		this.#pos = 0;
		this.#text = text;
		this.#segments = [];
	}

	/**
	 * Returns the Array of segments compiled from scanning the given
	 * text string.
	 * 
	 * This string is split along any HTML comments found in the
	 * text, as per the scan method.
	 */
	get segments() {
		return this.#segments;
	}

	/**
	 * Checks the following text in the string at the current scanner position.
	 * 
	 * @param {number} n How many characters to peek forward.
	 * @returns The next characters in the text, up to n characters.
	 */
	#peek(n) { return this.#text.slice(this.#pos, this.#pos + n); }

	/**
	 * Gets the rest of the text being scanned from the current position.
	 * 
	 * @returns A string containing the rest of the text from the scanner position.
	 */
	#rest() { return this.#text.slice(this.#pos); }

	/**
	 * Checks whether or not a comment appears next in the text.
	 * 
	 * @returns {boolean} Whether or not a comment appears next in the text.
	 */
	commentNext() { return this.#peek(4) === '<!--'; }

	/**
	 * Checks whether there is still text to scan, or if the EOS (end of string)
	 * has been reached
	 * 
	 * @returns Whether the scanner has reached the end of the string.
	 */
	#notEOS() { return this.#pos < this.#text.length; }

	/**
	 * Scans the text at the current position for a comment.
	 * 
	 * @returns An object with information on a comment-scan attempt.
	 */
	#scanComment() {
		const match = RegExp(/<!--.*?-->/g).exec(this.#rest())

		return match
			? { text: match[0], newPos: this.#pos + match[0].length }
			: { text: null, newPos: null }
	}

	/**
	 * Scans the given text and separates it into segments, which are
	 * split by instances of HTML comments. 
	 */
	scan() {
		let currentSegment = ""

		while (this.#notEOS()) {
			let currentChar = this.#text.charAt(this.#pos)

			// Character may be opening for comment.
			if (currentChar === '<') {
				// If comment coming up, scan and push relevant segments.
				if (this.commentNext()) {
					let comment = this.#scanComment()

					this.#segments.push({ comment: false, text: currentSegment })
					this.#segments.push({ comment: true, text: comment.text })

					// Update scanner and current segment for new segment.
					this.#pos = comment.newPos
					currentSegment = ""

					continue
				}
			}

			// Add character to segment and iterate along text.
			currentSegment += currentChar
			this.#pos++
		}

		// If there is a remaining segment, add it to list.
		if (currentSegment.length > 0) {
			this.#segments.push({ comment: false, text:currentSegment })
		}
	}
}

// Support both default and named export.
module.exports = CommentScanner
module.exports.CommentScanner = CommentScanner