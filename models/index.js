import Persona from './Persona.js';
import Tipo from './Tipo.js';
import Comprador from './Comprador.js';
import Lote from './Lote.js';
import Especie from './Especie.js';
import Compra from './Compra.js';

// Las bajas se rechazan (RESTRICT) si hay registros relacionados: nunca se borra en cascada.

// Tipo 1 — N Especie
Tipo.hasMany(Especie, { foreignKey: 'id_tpo', as: 'especies', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Especie.belongsTo(Tipo, { foreignKey: 'id_tpo', as: 'tipo' });

// Lote 1 — N Especie
Lote.hasMany(Especie, { foreignKey: 'id_lte', as: 'especies', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Especie.belongsTo(Lote, { foreignKey: 'id_lte', as: 'lote' });

// Lote 1 — 1 Compra (Compra.id_cmp = Lote.id_lte)
Lote.hasOne(Compra, { foreignKey: 'id_cmp', as: 'compra', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Compra.belongsTo(Lote, { foreignKey: 'id_cmp', as: 'lote' });

// Comprador 1 — N Compra
Comprador.hasMany(Compra, { foreignKey: 'codigo_cpr', as: 'compras', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Compra.belongsTo(Comprador, { foreignKey: 'codigo_cpr', as: 'comprador' });

export { Persona, Tipo, Comprador, Lote, Especie, Compra };
