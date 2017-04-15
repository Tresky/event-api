module.exports = (db, DataTypes) => {
  let classMethods = {
    associate (models) {}
  }

  let instanceMethods = {}

  let hooks = {}

  var Event = db.define('Event', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    latitude: DataTypes.DOUBLE,
    longitude: DataTypes.DOUBLE,
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    privacy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contactPhone: DataTypes.STRING,
    contactEmail: DataTypes.STRING,
    rsoId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    universityId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    inactiveAt: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    inactiveById: DataTypes.INTEGER
  }, {
    tableName: 'Event',
    instanceMethods: instanceMethods,
    classMethods: classMethods,
    hooks: hooks
  })

  return Event
}
