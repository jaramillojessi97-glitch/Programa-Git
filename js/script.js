'use strict';

/*
 * Safe Driving - módulo web de gestión vehicular.
 * Framework de interfaz: Bootstrap 5.
 * Persistencia demostrativa: localStorage del navegador.
 * Nota: esta versión académica no reemplaza una base de datos de producción.
 */

// Datos iniciales de ejemplo para facilitar la demostración.
const datosIniciales = {
  vehiculos: [
    { id: 1, placa: 'ABC123', marca: 'Chevrolet', modelo: '2020', soat: '2026-12-15', tecnomecanica: '2026-11-20' },
    { id: 2, placa: 'XYZ789', marca: 'Renault', modelo: '2019', soat: '2026-10-15', tecnomecanica: '2027-02-10' }
  ],
  conductores: [
    { id: 1, nombre: 'Carlos Pérez', documento: '10203040', telefono: '3001234567', examen: '2026-11-18' }
  ]
};

function cargarDatos() {
  // Si no existen datos guardados, se cargan los registros de demostración.
  const guardados = localStorage.getItem('safeDrivingDatos');
  return guardados ? JSON.parse(guardados) : structuredClone(datosIniciales);
}

let datos = cargarDatos();

function guardarDatos() {
  localStorage.setItem('safeDrivingDatos', JSON.stringify(datos));
}

function escaparHTML(valor) {
  // Evita insertar texto del usuario como HTML.
  return String(valor).replace(/[&<>"']/g, caracter => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[caracter]);
}

function mostrarSeccion(nombre) {
  document.querySelectorAll('.app-section').forEach(seccion => {
    seccion.classList.toggle('d-none', seccion.id !== nombre);
  });
  document.querySelectorAll('.nav-link').forEach(enlace => {
    enlace.classList.toggle('active', enlace.dataset.section === nombre);
  });
  actualizarInterfaz();
}

// Navegación entre los módulos de la aplicación.
document.querySelectorAll('[data-section]').forEach(enlace => {
  enlace.addEventListener('click', evento => {
    evento.preventDefault();
    mostrarSeccion(enlace.dataset.section);
  });
});

function diasHasta(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const destino = new Date(`${fecha}T00:00:00`);
  return Math.ceil((destino - hoy) / 86400000);
}

function estadoDocumento(fecha) {
  const dias = diasHasta(fecha);
  if (dias < 0) return { texto: 'Vencido', clase: 'danger' };
  if (dias <= 30) return { texto: 'Próximo a vencer', clase: 'warning' };
  return { texto: 'Vigente', clase: 'success' };
}

function actualizarInterfaz() {
  document.getElementById('totalVehiculos').textContent = datos.vehiculos.length;
  document.getElementById('totalConductores').textContent = datos.conductores.length;

  // Construye la tabla de vehículos usando los datos almacenados.
  document.getElementById('tablaVehiculos').innerHTML = datos.vehiculos.map(v => `
    <tr>
      <td class="fw-semibold">${escaparHTML(v.placa)}</td>
      <td>${escaparHTML(v.marca)}</td><td>${escaparHTML(v.modelo)}</td>
      <td>${escaparHTML(v.soat)}</td><td>${escaparHTML(v.tecnomecanica)}</td>
      <td><button class="btn btn-sm btn-outline-danger" data-delete-vehicle="${v.id}">Eliminar</button></td>
    </tr>`).join('') || '<tr><td colspan="6" class="text-center py-4">No hay vehículos registrados.</td></tr>';

  // Construye la tabla de conductores.
  document.getElementById('tablaConductores').innerHTML = datos.conductores.map(c => `
    <tr>
      <td class="fw-semibold">${escaparHTML(c.nombre)}</td><td>${escaparHTML(c.documento)}</td>
      <td>${escaparHTML(c.telefono)}</td><td>${escaparHTML(c.examen)}</td>
      <td><button class="btn btn-sm btn-outline-danger" data-delete-driver="${c.id}">Eliminar</button></td>
    </tr>`).join('') || '<tr><td colspan="5" class="text-center py-4">No hay conductores registrados.</td></tr>';

  actualizarAlertas();
  actualizarReportes();
}

function obtenerDocumentos() {
  const documentos = [];
  datos.vehiculos.forEach(v => {
    documentos.push({ titular: v.placa, tipo: 'SOAT', fecha: v.soat });
    documentos.push({ titular: v.placa, tipo: 'Revisión técnico-mecánica', fecha: v.tecnomecanica });
  });
  datos.conductores.forEach(c => documentos.push({ titular: c.nombre, tipo: 'Examen médico', fecha: c.examen }));
  return documentos;
}

function actualizarAlertas() {
  // Se consideran alertas los documentos vencidos o que vencen en 30 días o menos.
  const alertas = obtenerDocumentos().filter(doc => diasHasta(doc.fecha) <= 30);
  document.getElementById('totalAlertas').textContent = alertas.length;
  document.getElementById('listaAlertas').innerHTML = alertas.map(doc => {
    const estado = estadoDocumento(doc.fecha);
    return `<div class="alert alert-${estado.clase} mb-0"><strong>${escaparHTML(doc.tipo)}</strong> · ${escaparHTML(doc.titular)}: ${estado.texto} (${escaparHTML(doc.fecha)}).</div>`;
  }).join('') || '<div class="alert alert-success">No hay documentos vencidos ni próximos a vencer.</div>';
}

function actualizarReportes() {
  const marcas = {};
  datos.vehiculos.forEach(v => { marcas[v.marca] = (marcas[v.marca] || 0) + 1; });
  document.getElementById('reporteMarcas').innerHTML = Object.entries(marcas).map(([marca, total]) =>
    `<li>${escaparHTML(marca)}: ${total}</li>`).join('') || '<li>Sin registros.</li>';
  const docs = obtenerDocumentos();
  const vencidos = docs.filter(doc => diasHasta(doc.fecha) < 0).length;
  const proximos = docs.filter(doc => diasHasta(doc.fecha) >= 0 && diasHasta(doc.fecha) <= 30).length;
  document.getElementById('reporteDocumentos').textContent =
    `${docs.length} documentos registrados: ${vencidos} vencidos y ${proximos} próximos a vencer.`;
}

// Registro de vehículos con validación básica y almacenamiento local.
document.getElementById('formVehiculo').addEventListener('submit', evento => {
  evento.preventDefault();
  const placa = document.getElementById('placa').value.trim().toUpperCase();
  if (datos.vehiculos.some(v => v.placa === placa)) {
    alert('Ya existe un vehículo registrado con esa placa.');
    return;
  }
  datos.vehiculos.push({
    id: Date.now(), placa,
    marca: document.getElementById('marca').value.trim(),
    modelo: document.getElementById('modelo').value.trim(),
    soat: document.getElementById('soat').value,
    tecnomecanica: document.getElementById('tecnomecanica').value
  });
  guardarDatos();
  evento.target.reset();
  bootstrap.Modal.getInstance(document.getElementById('vehiculoModal')).hide();
  actualizarInterfaz();
});

// Registro de conductores.
document.getElementById('formConductor').addEventListener('submit', evento => {
  evento.preventDefault();
  datos.conductores.push({
    id: Date.now(),
    nombre: document.getElementById('nombre').value.trim(),
    documento: document.getElementById('documento').value.trim(),
    telefono: document.getElementById('telefono').value.trim(),
    examen: document.getElementById('examen').value
  });
  guardarDatos();
  evento.target.reset();
  bootstrap.Modal.getInstance(document.getElementById('conductorModal')).hide();
  actualizarInterfaz();
});

// Delegación de eventos para eliminar registros de las tablas.
document.addEventListener('click', evento => {
  const idVehiculo = evento.target.dataset.deleteVehicle;
  const idConductor = evento.target.dataset.deleteDriver;
  if (idVehiculo && confirm('¿Deseas eliminar este vehículo?')) {
    datos.vehiculos = datos.vehiculos.filter(v => v.id !== Number(idVehiculo));
    guardarDatos();
    actualizarInterfaz();
  }
  if (idConductor && confirm('¿Deseas eliminar este conductor?')) {
    datos.conductores = datos.conductores.filter(c => c.id !== Number(idConductor));
    guardarDatos();
    actualizarInterfaz();
  }
});

// Inicializa el contenido al cargar la aplicación.
actualizarInterfaz();
