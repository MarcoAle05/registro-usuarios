import { Libro } from '../models/index.js';

// Libros predeterminados: solo se cargan cuando la tabla está vacía.
// Los precios son de ejemplo; se pueden cambiar directamente en la base de datos.
const LIBROS = [
  {
    titulo: 'Algoritmos Java',
    autor: 'Autor no especificado',
    precio: 350,
    imagen: '/bootstrap/img/libro_1.jpg',
  },
  {
    titulo: 'Curso de programación Java',
    autor: 'Mariona Nadal Farré',
    precio: 420,
    imagen: '/bootstrap/img/libro_2.jpg',
  },
  {
    titulo: 'Programación en Java 6',
    autor: 'Luis Joyanes Aguilar e Ignacio Zahonero Martínez',
    precio: 580,
    imagen: '/bootstrap/img/libro_3.jpg',
  },
];

export const sembrarLibros = async () => {
  if ((await Libro.count()) > 0) return;
  await Libro.bulkCreate(LIBROS);
  console.log('Libros predeterminados cargados.');
};
