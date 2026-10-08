import Persona from './Persona.js';
import Libro from './Libro.js';
import Venta from './Venta.js';

// Asociaciones
Persona.hasMany(Venta, { foreignKey: 'personaId', as: 'venta' });
Venta.belongsTo(Persona, { foreignKey: 'personaId', as: 'persona' });

Libro.hasMany(Venta, { foreignKey: 'libroId', as: 'venta' });
Venta.belongsTo(Libro, { foreignKey: 'libroId', as: 'libro' });

export { Persona, Libro, Venta };
