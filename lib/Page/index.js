/**
 * Page
 * @param {Object} page
 * @param {String} page.id 
 * @param {String} page.name 
 * @param {Array.<String>} page.requirements 
 * @param {Object} page.actions
 * @returns {Object}
 */

module.exports = function ({
    id, name, requirements, actions
}) {
    return { id, name, requirements, actions }
}