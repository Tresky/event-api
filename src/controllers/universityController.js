let db = require('../db.js')
let helpers = require('../lib/controllerHelpers')
let ApiErrors = require('../lib/apiErrors')

exports.index = (req, res) => {
  // TODO: Not sure if we even need this function to exists?
  // Discuss later.
}

exports.show = (req, res, next) => {
  let params = helpers.requireParams([
    'id'
  ], req.body)

  db.University.findById(params.id)
    .then((uni) => {
      if (!uni) {
        return next(new ApiErrors.UniversityRecordNotFound())
      }
      res.json(uni)
    })
}

exports.create = (req, res, next) => {
  // TODO: Somehow need to figure out how to limit the creation
  // of universities to specific new users that sign up. I've got ideas.

  let params = helpers.requireParams([
    'created_by_id',
    'name',
    'description'
  ], req.body)

  db.University.createUniversity(params, (err, uni) => {
    if (err) {
      // University#createUniversity is a custom class function, so
      // the errors that come from it are already ApiErrors.
      return next(err)
    }
    res.json(uni)
  })
}

exports.update = (req, res, next) => {
  // TODO: Need to allow the updating of values in the University.
  // Note: Probably shouldn't allow the name to be updated.
}

// The destroy functionality doesn't actually destroy
// the record being targeted in the traditional sense.
// Instead, a deleted_at timestamp is set to signal to
// us that this record should no longer be used. This
// allows us to keep a full history of records and we
// never lose data.
exports.destroy = (req, res, next) => {
  // TODO: Permissions need to be restricted.
  // Do we even want to allow deletion of Universities?

  let params = helpers.requireParams([
    'id'
  ], req.body)

  db.University.findById(params.id)
    .then((uni) => {
      if (!uni) {
        return next(new ApiErrors.UniversityRecordNotFound(params))
      }

      uni.setDataValue('deleted_at', new Date())
      res.json(uni)
    })
}
