import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const obligatorio = (msg) => ({ notEmpty: { msg } });

const Comprador = db.define(
  'Comprador',
  {
    codigo_cpr: { type: DataTypes.SMALLINT, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(15), allowNull: false, validate: obligatorio('El nombre es obligatorio') },
    apellido_paterno: { type: DataTypes.STRING(15), allowNull: false, validate: obligatorio('El apellido paterno es obligatorio') },
    apellido_materno: { type: DataTypes.STRING(15), allowNull: false, validate: obligatorio('El apellido materno es obligatorio') },
    direccion: { type: DataTypes.STRING(200), allowNull: false, validate: obligatorio('La dirección es obligatoria') },
    correo: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      validate: { isEmail: { msg: 'El correo no es válido' } },
    },
  },
  { tableName: 'comprador', timestamps: false }
);

export default Comprador;
