import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const Persona = db.define(
  'Persona',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'El apellido es obligatorio' } },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: { msg: 'El email no es válido' } },
    },
    edad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'La edad debe ser un número entero' },
        min: { args: [0], msg: 'La edad debe estar entre 0 y 120' },
        max: { args: [120], msg: 'La edad debe estar entre 0 y 120' },
      },
    },
    // Contraseña (siempre se guarda encriptada con bcrypt)
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'persona',
    timestamps: true,
  }
);

export default Persona;
