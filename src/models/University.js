module.exports = (db, DataTypes) => {
  let classMethods = {}

  let instanceMethods = {}

  let hooks = {}

  let University = db.define('University', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    created_by_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'University',
    instanceMethods: instanceMethods,
    classMethods: classMethods,
    hooks: hooks
  })

  University.sync()

  return University
}
