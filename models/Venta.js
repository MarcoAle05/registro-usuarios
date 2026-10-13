import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const Venta = db.define(
  'Venta',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    // Precio de cada ejemplar al momento de la compra (ventas antiguas: null)
    precioUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'venta',
    timestamps: false,
  }
);

export default Venta;
