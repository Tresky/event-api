let colors = require('colors')

/**
 * File: apiErrors.js
 * Author: Tyler Petresky
 * Description: Define a standardized way of handling
 * exceptions throughout the API. This file defines
 * a base class that all ApiErrors inherit from. This
 * allows me to define a custom middleware (handleError()
 * at the bottom of this file) that will allow Express
 * to handle the custom ApiErrors correctly.
 */

// Base ApiError class
class ApiError {
  constructor (message, code, status, raw) {
    this.type = 'ApiError'
    this.message = message
    this.code = code
    this.status = status
    this.raw = raw
  }

  /**
   * Print the error information
   */
  print () {
    console.log(colors.red(`ApiError #${this.code} [${this.status}]:`), `${(this.code === 1) ? this.raw : this.message}`)
  }

  /**
   * Print the error data of the raw error that the
   * ApiError was built on.
   */
  printRaw () {
    if (this.raw) {
      console.log(this.raw)
    }
  }
}

// Default error type whenever an exception is
// encountered and it is not a known `ApiError`.
module.exports.Unknown = class extends ApiError {
  constructor (raw) {
    super('Unknown error has occured', 1, 500, raw)
  }
}

/**
 * General HTTP Request Errors
 */
module.exports.RequiredParametersMissing = class extends ApiError {
  constructor (raw) {
    super('Function has required parameter(s) that are missing', 100, 400, raw)
  }
}

module.exports.NoUniversityIdMatch = class extends ApiError {
  constructor (raw) {
    super('A UniversityId is required for this action', 101, 400, raw)
  }
}

module.exports.UserNotAuthenticated = class extends ApiError {
  constructor (raw) {
    super('User must be authenticated to access this resource', 102, 403, raw)
  }
}

module.exports.InvalidPermissionForAction = class extends ApiError {
  constructor (raw) {
    super('User lacks the valid permission to access this resource', 103, 403, raw)
  }
}

module.exports.AuthTokenExpired = class extends ApiError {
  constructor (raw) {
    super('Authentication token has expired; please re-log in', 104, 401, raw)
  }
}

/**
 * LoginController Errors
 */
module.exports.FailedToLogin = class extends ApiError {
  constructor (raw) {
    super('Failed to login to user account', 200, 401, raw)
  }
}

module.exports.FailedToSignup = class extends ApiError {
  constructor (raw) {
    super('Creation of a new user record failed', 201, 400, raw)
  }
}

module.exports.UserExistsWithEmail = class extends ApiError {
  constructor (raw) {
    super('User with given email already exists', 202, 400, raw)
  }
}

module.exports.NoUniversitySpecifiedToJoin = class extends ApiError {
  constructor (raw) {
    super('User must be added to a University', 203, 400, raw)
  }
}

/**
 * UniversityController Errors
 */
exports.UniversityRecordNotFound = class extends ApiError {
  constructor (raw) {
    super('University record with given ID was not found', 300, 400, raw)
  }
}

exports.UniversityExistsWithName = class extends ApiError {
  constructor (raw) {
    super('University with the given name already exists', 301, 400, raw)
  }
}

exports.InvalidUserCreatingUniversity = class extends ApiError {
  constructor (raw) {
    super('University must be created by a valid user', 302, 400, raw)
  }
}

exports.FailedToCreateUniversity = class extends ApiError {
  constructor (raw) {
    super('Failed to create university record', 303, 400, raw)
  }
}

/**
 * MembershipController Errors
 */
exports.AlreadyHaveActiveUniversityMembership = class extends ApiError {
  constructor (raw) {
    super('Cannot have more than one active university-level membership', 400, 400, raw)
  }
}

exports.InvalidRsoPermissionLevel = class extends ApiError {
  constructor (raw) {
    super('Rso memberships cannot be SUPERADMIN', 401, 400, raw)
  }
}

exports.InvalidUniversityPermissionLevel = class extends ApiError {
  constructor (raw) {
    super('University memberships cannot be ADMIN', 402, 400, raw)
  }
}

exports.FailedToCreateMembership = class extends ApiError {
  constructor (raw) {
    super('Failed to create a membership record', 403, 400, raw)
  }
}

/**
 * RsoController Errors
 */
exports.InvalidUserSpecifiedForCreation = class extends ApiError {
  constructor (raw) {
    super('User specified for Rso creation is invalid', 500, 400, raw)
  }
}

exports.NotEnoughMembersInRso = class extends ApiError {
  constructor (raw) {
    super('Not enough members specified to create Rso', 501, 400, raw)
  }
}

/**
 * UserController Errors
 */
exports.UserRecordNotFound = class extends ApiError {
  constructor (raw) {
    super('User record with given ID was not found', 700, 400, raw)
  }
}

exports.NoRsoInUniversity = class extends ApiError {
  constructor (raw) {
    super('University lacks RSO with given ID', 502, 400, raw)
  }
}

/**
  * EventController Errors
  */
exports.NoEventinRso = class extends ApiError {
  constructor (raw) {
    super('RSO lacks event with given ID', 600, 400, raw)
  }
}

exports.EventPrivacyRestriction = class extends ApiError {
  constructor (raw) {
    super('Event privacy restricted for this user', 601, 403, raw)
  }
}

exports.UserNotInRso = class extends ApiError {
  constructor (raw) {
    super('User not in RSO', 602, 403, raw)
  }
}

/**
 * SubscriptionController Errors
 */
exports.UserAlreadySubscribedToRso = class extends ApiError {
  constructor (raw) {
    super('Authenticated user is already subscribed to this RSO', 700, 400, raw)
  }
}

/**
 * Generates the `body` of an error based
 * on the ApiError object specified.
 * @param  {Object} err ApiError object to generate body of
 * @return {Object}     Error body object for `err`
 */
let createErrorBody = (err) => {
  return {
    message: err.code + ' | ' + err.message,
    errorCode: err.code,
    raw: err.raw
  }
}

/**
 * Middleware function for Express to handle all of
 * the ApiErrors that are generated by the API. This
 * function is imported in `app.js` and utilized by
 * Express directly.
 * @param  {Object}   err  ApiErrors object to catch and handle
 * @param  {Object}   req  Request object for the current HTTP request
 * @param  {Object}   res  Response object to issue a response to the request
 * @param  {Function} next next() function to tell Express to 'move on'
 */
module.exports.handleError = (err, req, res, next) => {
  if (!err.type || err.type !== 'ApiError') {
    err = new module.exports.Unknown(err)
  }

  // Print the error information
  if (!process.env.API_ERRORS_OFF) {
    err.print()
    err.printRaw()
  }

  // Set the status and send the generated error body
  // back to the front-end.
  res.status(err.status || 500)
  res.send(createErrorBody(err))
}
