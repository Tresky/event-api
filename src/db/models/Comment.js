module.exports = (db, DataTypes) => {
  let classMethods = {}

  let instanceMethods = {}

  let hooks = {}

  var Comment = db.define('Comment', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    inactiveAt: {
      type: DataTypes.DATE,
      defaultValue: null
    }
  }, {
    tableName: 'Comment',
    instanceMethods: instanceMethods,
    classMethods: classMethods,
    hooks: hooks
  })

  return Comment
}
