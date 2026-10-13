// Sin JavaScript en línea: todo el comportamiento vive aquí (compatible con la CSP).

// Eliminar: el modal de Bootstrap recibe el nombre y la ruta desde atributos data-*.
// El nombre se escribe con textContent, nunca como HTML ni dentro de código (evita XSS).
const modalEliminar = document.getElementById('modalEliminar');
if (modalEliminar) {
  modalEliminar.addEventListener('show.bs.modal', (e) => {
    const boton = e.relatedTarget;
    modalEliminar.querySelector('#modalEliminarNombre').textContent = boton.dataset.nombre;
    modalEliminar.querySelector('form').action = boton.dataset.action;
  });
}

// Mostrar / ocultar contraseña
document.querySelectorAll('[data-mostrar-password]').forEach((boton) => {
  boton.addEventListener('click', () => {
    const campo = document.getElementById(boton.dataset.mostrarPassword);
    const visible = campo.type === 'text';
    campo.type = visible ? 'password' : 'text';
    boton.textContent = visible ? 'Mostrar' : 'Ocultar';
    boton.setAttribute('aria-pressed', String(!visible));
  });
});

// Generar contraseña temporal (solo administradores): sin caracteres ambiguos (0/O, 1/l/I)
document.querySelectorAll('[data-generar-password]').forEach((boton) => {
  boton.addEventListener('click', () => {
    const campo = document.getElementById(boton.dataset.generarPassword);
    const alfabeto = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const azar = crypto.getRandomValues(new Uint32Array(12));
    campo.value = Array.from(azar, (n) => alfabeto[n % alfabeto.length]).join('');
    campo.type = 'text';
    const mostrar = document.querySelector(`[data-mostrar-password="${campo.id}"]`);
    if (mostrar) { mostrar.textContent = 'Ocultar'; mostrar.setAttribute('aria-pressed', 'true'); }
    campo.focus();
    campo.select();
  });
});

// Si hay un error de formulario, el foco va al aviso para que se anuncie y se vea
document.querySelector('[data-enfocar]')?.focus();

// Oculta imágenes que no existen (sin onerror en línea)
document.querySelectorAll('img[data-ocultar-si-falla]').forEach((img) => {
  const ocultar = () => (img.style.display = 'none');
  if (img.complete && img.naturalWidth === 0) ocultar();
  img.addEventListener('error', ocultar);
});

// Envío en curso: el botón queda ocupado (aria-disabled, no disabled, para no perder el foco)
// y se ignoran los clics repetidos; la etiqueta original se conserva.
document.querySelectorAll('form[data-enviando]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    if (form.dataset.ocupado === 'true') return e.preventDefault();
    form.dataset.ocupado = 'true';
    const boton = form.querySelector('button[type="submit"]');
    if (boton) {
      boton.setAttribute('aria-disabled', 'true');
      boton.setAttribute('aria-busy', 'true');
    }
  });
});
