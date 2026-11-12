import { Tipo, Comprador } from '../models/index.js';

// Datos iniciales: solo se cargan cuando las tablas están vacías.
const TIPOS = ['Pescado', 'Marisco', 'Molusco'];

const COMPRADORES = [
  {
    nombre: 'Rosa', apellido_paterno: 'Hernández', apellido_materno: 'Cruz',
    direccion: 'Av. Díaz Mirón 120, Veracruz, Ver.', correo: 'rosa.hernandez@example.com',
  },
  {
    nombre: 'Carlos', apellido_paterno: 'Domínguez', apellido_materno: 'Ríos',
    direccion: 'Calle Hidalgo 45, Boca del Río, Ver.', correo: 'carlos.dominguez@example.com',
  },
];

export const sembrarDatos = async () => {
  if ((await Tipo.count()) === 0) {
    await Tipo.bulkCreate(TIPOS.map((nombre) => ({ nombre })));
    console.log('Tipos predeterminados cargados.');
  }
  if ((await Comprador.count()) === 0) {
    await Comprador.bulkCreate(COMPRADORES);
    console.log('Compradores de ejemplo cargados.');
  }
};
