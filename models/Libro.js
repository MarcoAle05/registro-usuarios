import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const Libro = db.define(
  'Libro',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    autor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: 'libro',
    timestamps: false,
  }
);

export default Libro;
