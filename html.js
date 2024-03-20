/**
 * Convenience function to syntax highlight `html` tagged template literals
 * 
 * @param {string[]} strings text parts of template literal
 * @param {...any} values expression to be inserted in the current position, whose value is converted to a string
 * @returns {string} processed template literal with replaced expressions
 */
export const html = (strings, ...values) => String.raw({ raw: strings }, ...values);