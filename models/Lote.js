import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const Lote = db.define(
  'Lote',
  {
    id_lte: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    kilos: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: { args: [0.01], msg: 'Los kilos deben ser mayores a 0' } },
    },
    numero_cajas: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      validate: { min: { args: [1], msg: 'El número de cajas debe ser al menos 1' }, isInt: { msg: 'El número de cajas debe ser entero' } },
    },
    precio_kilo_salida: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: { args: [0.01], msg: 'El precio de salida debe ser mayor a 0' } },
    },
    fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: 'lote', timestamps: false }
);

export default Lote;
