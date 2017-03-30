let _ = require('lodash')

let ApiErrors = require('../../lib/apiErrors')

module.exports = (db, DataTypes) => {
  let classMethods = {
    /**
     * Creates a new university record using the given
     * data that is passed in.
     * @param {Object}   data Data to create the university with
     * @param {Function} cb   Callback function
     */
    createUniversity (data, cb) {
      // Need to check if the university exists already
      // and if the user creating it exists.
      let promises = _.concat([],
        universityExists(data.name)
      )

      Promise.all(promises)
        .then((results) => {
          if (results[0]) {
            // If this is true, the university already
            // exists at the given name.
            cb(new ApiErrors.UniversityExistsWithName(data), null)
          } else {
            // Valid information
            let newUni = University.build(data)

            // Potential to set values in future
            // ...

            newUni.save()
              .then((res) => {
                cb(null, res)
              })
              .catch((err) => {
                cb(new ApiErrors.FailedToCreateUniversity(err), null)
              })
          }
        })
    }
  }

  let instanceMethods = {}

  let hooks = {}

  let University = db.define('University', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    inactiveAt: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    inactiveById: DataTypes.INTEGER
  }, {
    tableName: 'University',
    instanceMethods: instanceMethods,
    classMethods: classMethods,
    hooks: hooks
  })

  /*******************
   * LOCAL FUNCTIONS *
   *******************/

  /**
   * Check to see is a university with the given name
   * already exists or not.
   * @param  {String} name Name to check for in the DB
   * @return {Boolean}     True if name exists; false otherwise
   */
  let universityExists = (name) => {
    return University.count({ where: { name: name } })
      .then((count) => {
        return (count > 0)
      })
  }

  return University
}
