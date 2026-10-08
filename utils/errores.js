// Convierte errores de Sequelize en un mensaje entendible
export const mensajeError = (err) => {
  if (err.name === 'SequelizeUniqueConstraintError') {
    return { texto: 'Ese email ya está registrado', yaRegistrado: true };
  }
  if (err.name === 'SequelizeValidationError') {
    return { texto: err.errors.map((e) => e.message).join('. ') };
  }
  console.error(err);
  return { texto: 'Ocurrió un error inesperado. Intenta de nuevo' };
};
