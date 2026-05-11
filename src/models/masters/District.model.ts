import { DataTypes } from 'sequelize';
import sequelize from '../../config/sequelize';
import Block from './Block.model';
import Cluster from './Cluster.model';
import Constituency from './Constituency.model';

const District = sequelize.define(
  'district',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

District.hasMany(Constituency, { foreignKey: 'district_id' });
Constituency.belongsTo(District, { foreignKey: 'district_id' });

District.hasMany(Block, { foreignKey: 'district_id' });
Block.belongsTo(District, { foreignKey: 'district_id' });

District.hasMany(Cluster, { foreignKey: 'district_id' });
Cluster.belongsTo(District, { foreignKey: 'district_id' });

export default District;
