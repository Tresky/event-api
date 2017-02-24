let bcrypt = require('bcrypt-nodejs')
let crypto = require('crypto')

let ApiErrors = require('../lib/apiErrors')

module.exports = (db, DataTypes) => {
  /*******************
   * CLASS FUNCTIONS *
   *******************/

  let classMethods = {
    associate (models) {
      User.belongsToMany(models.Rso, {
        through: models.Membership,
        foreignKey: 'userId'
      })
    },

    /**
     * Encrypt a given password using the bcrypt
     * package. Salt will be applied before saving.
     * @param  {string}   password Password to encrypt
     * @param  {Function} cb       Callback function
     */
    encryptPassword (password, cb) {
      if (!password) {
        cb('', null)
        return
      }

      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          cb(null, err)
          return
        }

        bcrypt.hash(password, salt, null, (hashErr, hash) => {
          if (hashErr) {
            cb(null, hashErr)
            return
          }
          cb(hash, null)
        })
      })
    },

    /**
     * Finds a single user within the database based
     * on email and makes sure the password provided
     * matches the hash that is saved.
     * @param  {string}   email Email address to look up
     * @param  {string}   password Password to hash and compare
     * @param  {Function} cb Callback function
     */
    findUser (email, password, cb) {
      User.findOne({
        where: { email: email }
      }).then((user) => {
        if (!user || !user.password || user.password.length === 0) {
          cb('Email / Password combination is incorrect', null)
          return
        }

        bcrypt.compare(password, user.password, (err, res) => {
          if (res) {
            cb(null, user)
          } else {
            cb(err, null)
          }
        })
      })
      .catch((serr) => {
        cb(serr, null)
      })
    },

    /**
     * Creates a new user record using the given
     * data that is passed in.
     * @param {Object}   data Data to create the user with
     * @param {Function} cb   Callback function
     */
    createUser (data, cb) {
      // Check if user exists, first
      userExists(data.email)
        .then((exists) => {
          if (exists) {
            // The email already exists, so we throw
            // an exception.
            cb(new ApiErrors.UserExistsWithEmail(data), null)
          } else {
            let newUser = User.build(data)

            // Potential to set values in future
            // ...

            newUser.save()
              .then((res) => {
                cb(null, res)
              })
              .catch((err) => {
                cb(new ApiErrors.FailedToSignup(err), null)
              })
          }
        })
    }
  }

  /**********************
   * INSTANCE FUNCTIONS *
   **********************/

  let instanceMethods = {
    /**
     * Return a reference to a Gravatar image
     * that is based on the user's email address.
     * If no email address is provided, it defaults
     * to generating without one.
     * @param  {integer} size Size of the gravatar image in pixels
     * @return {string}  URL to a Gravatar image
     */
    getGravatarUrl (size) {
      if (!size) {
        size = 200
      }

      if (!this.email) {
        return 'https://gravatar.com/avatar/?s=' + size + '&d=retro'
      }

      var md5 = crypto.createHash('md5')
        .update(this.email)
        .digest('hex')
      return 'https://gravatar.com/avatar/' + md5 + '?s=' + size + '&d=retro'
    },

    /**
     * Returns true is the user's password has been set,
     * false otherwise.
     */
    hasSetPassword () {
      return this.password && this.password.length > 0
    }
  }

  /**
   * Runs everytime a user is saved. If the password
   * has been changed, encrypt the new password before
   * you commit it to the database.
   */
  let beforeSaveHook = (user, options, fn) => {
    if (user.changed('email')) {
      user.email = user.email.toLowerCase()
    }

    if (user.changed('password')) {
      User.encryptPassword(user.password, (hash, err) => {
        user.password = hash
        fn(null, user)
      })
      return
    }
    fn(null, user)
  }

  let hooks = {
    beforeUpdate: beforeSaveHook,
    beforeCreate: beforeSaveHook
  }

  let User = db.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      isEmail: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    logins: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    resetPasswordExpires: DataTypes.DATE,
    resetPasswordToken: DataTypes.STRING
  }, {
    tableName: 'Users',
    instanceMethods: instanceMethods,
    classMethods: classMethods,
    hooks: hooks
  })

  User.sync()

  /*******************
   * LOCAL FUNCTIONS *
   *******************/

  /**
   * Check to see is a user with the given email
   * already exists or not.
   * @param  {String} email Email to check for in the DB
   * @return {Boolean}      True if email exists; false otherwise
   */
  let userExists = (email) => {
    return User.count({ where: { email: email } })
      .then((count) => {
        if (count > 0) {
          return true
        }
        return false
      })
  }

  return User
}
