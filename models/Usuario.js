import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const Usuario = db.define(
  'Usuario',
  {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'usuario',
    timestamps: true,
  }
);

export default Usuario;
