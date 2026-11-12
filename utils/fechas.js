// La Lonja trabaja con la hora de Veracruz (centro de México, UTC-6 todo el año).
const ZONA = 'America/Mexico_City';
const DESFASE = '-06:00';

// Fecha de hoy en la zona de la Lonja, como YYYY-MM-DD
export const hoyISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date());

// Inicio (incluido) y fin (excluido) de un día YYYY-MM-DD; null si no es válido
export const limitesDia = (iso) => {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const ini = new Date(`${iso}T00:00:00${DESFASE}`);
  if (Number.isNaN(ini.getTime()) || new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(ini) !== iso) return null;
  return { ini, fin: new Date(ini.getTime() + 24 * 60 * 60 * 1000) };
};

export const fechaCorta = (d) =>
  new Date(d).toLocaleDateString('es-MX', { timeZone: ZONA, day: 'numeric', month: 'short', year: 'numeric' });

export const fechaHora = (d) =>
  new Date(d).toLocaleString('es-MX', {
    timeZone: ZONA, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

export const soloHora = (d) =>
  new Date(d).toLocaleTimeString('es-MX', { timeZone: ZONA, hour: '2-digit', minute: '2-digit' });

// Valor para <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
export const aInputDT = (d) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(d)).map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};

// Texto de <input type="datetime-local"> → Date (o null si no es válido)
export const deInputDT = (texto) => {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(texto)) return null;
  const d = new Date(`${texto}:00${DESFASE}`);
  return Number.isNaN(d.getTime()) ? null : d;
};
