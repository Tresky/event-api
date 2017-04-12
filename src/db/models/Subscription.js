module.exports = (db, DataTypes) => {
  let classMethods = {}

  let instanceMethods = {}

  let hooks = {}

  var Subscription = db.define('Subscription', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rsoId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    inactiveAt: {
      type: DataTypes.DATE,
      defaultValue: null
    }
  }, {
    tableName: 'Subscription',
    instanceMethods: instanceMethods,
    classMethods: classMethods,
    hooks: hooks
  })

  return Subscription
}
