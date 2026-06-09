// asistencia.js — Control de asistencia

import { showToast, getFechaHoy, getHoraAhora, fechaLegible } from './utils.js';
import { fbSaveAsistencia, fbDeleteAsistenciaHoy } from './db.js';
import { state } from './state.js';

export async function registrarAsistencia() {
  const input  = document.getElementById('scan-input');
  const codigo = (input.value || '').trim();
  const res    = document.getElementById('scan-result');

  if (!codigo) { input.focus(); return; }

  if (!state.estudiantes.length) {
    _mostrarResultado(res, 'warning', `
      <i class="ti ti-alert-triangle" style="color:#E65100"></i>
      <span style="color:#E65100">Aún cargando datos, espera un momento e intenta de nuevo.</span>`);
    input.value = ''; input.focus(); return;
  }

  const codigoLimpio = codigo.toUpperCase().trim();
  const estudiante = state.estudiantes.find(e =>
    (e.codigo    || '').toUpperCase().trim() === codigoLimpio ||
    (e.documento || '').trim()               === codigo.trim()
  );

  if (!estudiante) {
    _mostrarResultado(res, 'error', `
      <i class="ti ti-alert-circle" style="color:#A32D2D"></i>
      <span style="color:#A32D2D">No encontrado: <strong>${codigo}</strong> — Verifica que el carnet esté registrado.</span>`);
    input.value = ''; input.focus(); return;
  }

  await agregarAsistencia(estudiante, 'entrada');
  _mostrarResultado(res, 'ok', `
    <i class="ti ti-check" style="color:#085041"></i>
    <span style="color:#085041"><strong>${estudiante.nombres} ${estudiante.apellidos}</strong> — Grado ${estudiante.grado} — Entrada registrada ✓</span>`);
  input.value = '';
  input.focus();
}

export async function registrarManual() {
  const id   = document.getElementById('manual-estudiante').value;
  const tipo = document.getElementById('manual-tipo').value;
  if (!id) return;
  const estudiante = state.estudiantes.find(s => s.id === id);
  if (!estudiante) return;
  await agregarAsistencia(estudiante, tipo);
  renderAsistencia();
}

export async function agregarAsistencia(estudiante, tipo) {
  const reg = {
    id:           Date.now(),
    estudianteId: estudiante.id,
    nombre:       estudiante.nombres + ' ' + estudiante.apellidos,
    grado:        estudiante.grado,
    tipo,
    hora:         getHoraAhora(),
    fecha:        getFechaHoy()
  };
  try {
    await fbSaveAsistencia(reg);
  } catch (ex) {
    showToast('Error al guardar asistencia: ' + ex.message, 'error');
  }
}

export async function limpiarAsistenciaHoy() {
  if (!confirm('¿Limpiar todos los registros de asistencia de hoy?')) return;
  try {
    await fbDeleteAsistenciaHoy(getFechaHoy());
    showToast('Registros de hoy eliminados', 'ok');
  } catch (ex) {
    showToast('Error al limpiar: ' + ex.message, 'error');
  }
}

export function renderAsistencia() {
  const hoy      = getFechaHoy();
  const lista    = document.getElementById('lista-asistencia');
  const hoyItems = state.asistencia.filter(a => a.fecha === hoy);
  document.getElementById('asistencia-fecha').textContent = 'Fecha: ' + fechaLegible(hoy);
  if (!hoyItems.length) {
    lista.innerHTML = `<div class="empty-state" style="padding:20px"><i class="ti ti-scan" style="font-size:28px"></i>Sin registros hoy</div>`;
    return;
  }
  lista.innerHTML = hoyItems.map(a => `
    <div class="timeline-item">
      <div class="timeline-dot ${a.tipo === 'entrada' ? 'dot-green' : 'dot-red'}"></div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500">${a.nombre}</div>
        <div style="font-size:11px;color:var(--color-text-secondary)">Grado ${a.grado} · ${a.tipo === 'entrada' ? 'Entrada' : 'Salida'} · ${a.hora}</div>
      </div>
      <span class="badge ${a.tipo === 'entrada' ? 'badge-green' : 'badge-red'}">${a.tipo === 'entrada' ? '↑ Entrada' : '↓ Salida'}</span>
    </div>`).join('');
}

export function renderSelectEstudiantes() {
  const sel = document.getElementById('manual-estudiante');
  sel.innerHTML = '<option value="">Seleccionar estudiante...</option>';
  [...state.estudiantes]
    .sort((a, b) => (a.apellidos + a.nombres).localeCompare(b.apellidos + b.nombres))
    .forEach(e => {
      sel.innerHTML += `<option value="${e.id}">${e.apellidos} ${e.nombres} — ${e.grado}</option>`;
    });
}

export function focusScanInput() {
  document.getElementById('scan-input')?.focus();
}

export function updateScanIndicator(focused) {
  const indicator = document.getElementById('scan-focus-indicator');
  const pulse     = document.getElementById('scan-pulse');
  const text      = document.getElementById('scan-focus-text');
  if (!indicator) return;
  if (focused) {
    indicator.className = 'scan-focus-indicator';
    pulse.className     = 'scan-pulse';
    text.textContent    = 'Escáner activo — listo para leer';
  } else {
    indicator.className = 'scan-focus-indicator inactive';
    pulse.className     = 'scan-pulse inactive';
    text.textContent    = 'Haz clic aquí para activar el escáner';
  }
}

export function initScannerListeners() {
  const scanInput = document.getElementById('scan-input');
  scanInput.addEventListener('focus', () => updateScanIndicator(true));
  scanInput.addEventListener('blur', () => {
    setTimeout(() => {
      const pageAsistencia = document.getElementById('page-asistencia');
      if (!pageAsistencia?.classList.contains('active')) return;
      const activeTag = document.activeElement?.tagName;
      const activeId  = document.activeElement?.id;
      if (!['SELECT', 'BUTTON', 'A'].includes(activeTag) && activeId !== 'manual-estudiante') {
        scanInput.focus();
      } else {
        updateScanIndicator(false);
      }
    }, 150);
  });
  document.addEventListener('click', e => {
    const pageAsistencia = document.getElementById('page-asistencia');
    if (!pageAsistencia?.classList.contains('active')) return;
    const tag = e.target?.tagName;
    const id  = e.target?.id;
    if (!['INPUT', 'SELECT', 'BUTTON', 'A'].includes(tag) && id !== 'scan-input') {
      setTimeout(() => scanInput.focus(), 50);
    }
  });
}

function _mostrarResultado(el, tipo, html) {
  const estilos = {
    ok:      { bg: '#E1F5EE', border: '#5DCAA5' },
    error:   { bg: '#FCEBEB', border: '#F09595' },
    warning: { bg: '#FFF8E1', border: '#FFD54F' }
  };
  const s = estilos[tipo] || estilos.ok;
  el.style.display     = 'block';
  el.style.background  = s.bg;
  el.style.borderColor = s.border;
  el.innerHTML         = html;
}