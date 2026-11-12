import { DataTypes } from 'sequelize';
import db from '../config/db.js';

// id_cmp es a la vez la llave primaria y la llave foránea hacia Lote.id_lte
// (relación uno a uno: cada lote se compra una sola vez).
const Compra = db.define(
  'Compra',
  {
    id_cmp: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false },
    codigo_cpr: { type: DataTypes.SMALLINT, allowNull: false },
    precio_kilo_final: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: { args: [0.01], msg: 'El precio final por kilo debe ser mayor a 0' } },
    },
    precio_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: 'compra', timestamps: false }
);

export default Compra;
