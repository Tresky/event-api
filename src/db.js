const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const _ = require('lodash')
const config = require('../config/secrets')

let db = {}

let sequelize = new Sequelize(config.postgres.database,
                              config.postgres.username,
                              config.postgres.password,
                              config.postgres.config)
let modelsDir = path.join(__dirname, 'models')

// Import all of the models from the /models directory
fs.readdirSync(modelsDir)
  .filter((file) => {
    return (file.indexOf('.js') !== 0) && (file !== 'index.js')
  })
  .forEach((file) => {
    let model = sequelize.import(path.join(modelsDir, file))
    db[model.name] = model
  })

Object.keys(db).forEach((modelName) => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db)
  }
})

module.exports = _.extend({
  sequelize: sequelize,
  Sequelize: Sequelize
}, db)
