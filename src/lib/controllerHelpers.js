let _ = require('lodash')
let ApiErrors = require('./apiErrors')

module.exports = {
  /**
   * Checks an object of passed in parameters for a specific subset
   * of required ones. If the 'any' flag is set, then at least one
   * of the required parameters must be present to be considered valid.
   * If the 'any' flag is NOT set, then ALL of the required parameters,
   * must be present.
   * @param  {Array}   required List of parameters that must be present
   * @param  {Object}  params   Parameters to check for validity
   * @param  {Boolean} any      If true, at least one present; otherwise all
   * @return Object with the required params/values on it; otherwise exception
   */
  requireParams (required, params, any) {
    let intersection = _.intersection(_.keys(params), required)

    // We are not receiving what we were expecting, so throw an exception
    if ((!any && intersection.length !== required.length) ||
        (any && intersection.length === 0)) {
      if (_.includes(required, 'universityId') && !_.includes(intersection, 'universityId')) {
        throw new ApiErrors.NoUniversityIdMatch()
      } else {
        throw new ApiErrors.RequiredParametersMissing()
      }
    } else {
      return _.pick(params, _.intersection(_.keys(params), required))
    }
  },

  stripParams (required, params) {
    return _.pick(params, _.intersection(_.keys(params), required))
  }

}
