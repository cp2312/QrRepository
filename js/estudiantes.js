// estudiantes.js — Gestión y renderizado de estudiantes

import { genId, genCodigo, showToast } from './utils.js';
import { fbSaveEstudiante, fbDeleteEstudiante } from './db.js';
import { state } from './state.js';

export function openModal(id) {
  state.editandoId = id || null;
  document.getElementById('modal-title').textContent = id ? 'Editar Estudiante' : 'Registrar Estudiante';
  document.getElementById('form-error').style.display = 'none';
  if (id) {
    const e = state.estudiantes.find(s => s.id === id);
    if (e) _llenarFormulario(e);
  } else {
    _limpiarFormulario();
  }
  document.getElementById('modal-backdrop').classList.add('open');
  setTimeout(() => document.getElementById('f-nombres').focus(), 100);
}

export function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
  state.editandoId = null;
}

function _llenarFormulario(e) {
  document.getElementById('f-nombres').value    = e.nombres;
  document.getElementById('f-apellidos').value  = e.apellidos;
  document.getElementById('f-documento').value  = e.documento;
  document.getElementById('f-grado').value      = e.grado;
  document.getElementById('f-grupo').value      = e.grupo;
  document.getElementById('f-nacimiento').value = e.nacimiento || '';
  document.getElementById('f-genero').value     = e.genero || '';
  document.getElementById('f-acudiente').value  = e.acudiente || '';
  document.getElementById('f-telefono').value   = e.telefono || '';
}

function _limpiarFormulario() {
  ['f-nombres', 'f-apellidos', 'f-documento', 'f-acudiente', 'f-telefono']
    .forEach(fid => (document.getElementById(fid).value = ''));
  document.getElementById('f-grado').value      = '';
  document.getElementById('f-grupo').value      = 'A';
  document.getElementById('f-genero').value     = '';
  document.getElementById('f-nacimiento').value = '';
}

function _leerFormulario() {
  return {
    nombres:    document.getElementById('f-nombres').value.trim(),
    apellidos:  document.getElementById('f-apellidos').value.trim(),
    documento:  document.getElementById('f-documento').value.trim(),
    grado:      document.getElementById('f-grado').value,
    grupo:      document.getElementById('f-grupo').value,
    nacimiento: document.getElementById('f-nacimiento').value,
    genero:     document.getElementById('f-genero').value,
    acudiente:  document.getElementById('f-acudiente').value,
    telefono:   document.getElementById('f-telefono').value,
  };
}

export async function guardarEstudiante() {
  const datos = _leerFormulario();
  const err   = document.getElementById('form-error');
  if (!datos.nombres || !datos.apellidos || !datos.documento || !datos.grado) {
    err.textContent   = 'Por favor completa los campos obligatorios (*)';
    err.style.display = 'block';
    return;
  }
  if (!state.editandoId && state.estudiantes.find(e => e.documento === datos.documento)) {
    err.textContent   = 'Ya existe un estudiante con ese número de documento.';
    err.style.display = 'block';
    return;
  }
  err.style.display = 'none';

  let obj;
  if (state.editandoId) {
    const base = state.estudiantes.find(e => e.id === state.editandoId) || {};
    obj = { ...base, ...datos };
  } else {
    obj = {
      id: genId(), ...datos,
      codigo: genCodigo(datos.documento),
      fechaRegistro: new Date().toISOString(),
      activo: true
    };
  }

  try {
    await fbSaveEstudiante(obj);
    showToast(state.editandoId ? 'Estudiante actualizado ✓' : 'Estudiante registrado ✓', 'ok');
    closeModal();
  } catch (ex) {
    showToast('Error al guardar: ' + ex.message, 'error');
  }
}

export async function eliminarEstudiante(id) {
  if (!confirm('¿Eliminar este estudiante del sistema?')) return;
  try {
    await fbDeleteEstudiante(id);
    showToast('Estudiante eliminado', 'ok');
  } catch (ex) {
    showToast('Error al eliminar: ' + ex.message, 'error');
  }
}

export function renderTabla() {
  const search   = (document.getElementById('search-input').value || '').toLowerCase();
  const grado    = document.getElementById('filter-grado').value;
  const tbody    = document.getElementById('tabla-estudiantes');
  const empty    = document.getElementById('empty-estudiantes');
  const filtered = state.estudiantes.filter(e => {
    const texto = (e.nombres + ' ' + e.apellidos + ' ' + e.documento + ' ' + e.grado).toLowerCase();
    return texto.includes(search) && (!grado || e.grado === grado);
  });

  tbody.innerHTML = '';
  if (!filtered.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  filtered.forEach(e => {
    const initials = (e.nombres[0] + e.apellidos[0]).toUpperCase();
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="avatar">${initials}</span>${e.nombres} ${e.apellidos}</td>
      <td><span style="font-family:monospace;font-size:12px">${e.documento}</span></td>
      <td><span class="badge badge-green">${e.grado} ${e.grupo}</span></td>
      <td><span style="font-family:monospace;font-size:11px;color:var(--color-text-secondary)">${e.codigo}</span></td>
      <td><span class="badge ${e.activo ? 'badge-green' : 'badge-gray'}">${e.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td>
        <div class="action-bar">
          <button class="btn btn-secondary btn-sm" onclick="openModal('${e.id}')"><i class="ti ti-edit"></i></button>
          <button class="btn btn-secondary btn-sm" onclick="showPage('carnets');verCarnet('${e.id}')"><i class="ti ti-id"></i></button>
          <button class="btn btn-danger btn-sm" onclick="eliminarEstudiante('${e.id}')"><i class="ti ti-trash"></i></button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}