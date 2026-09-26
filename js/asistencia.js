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
const hoyItems = obtenerAsistenciaFiltrada();
  const filtro =
document.getElementById('filtro-periodo')?.value || 'dia';

document.getElementById('asistencia-fecha')
.textContent =
`Filtro: ${filtro.toUpperCase()}`;
  document.getElementById('contador-asistencia')
  .textContent =
  `Total registros: ${hoyItems.length}`;
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
function obtenerAsistenciaFiltrada() {

  const filtroPeriodo =
    document.getElementById('filtro-periodo')?.value || 'dia';

  const filtroGrado =
    document.getElementById('filtro-grado')?.value || '';

  const hoy = new Date();

  let datos = state.asistencia.filter(a => {

    const fechaRegistro = new Date(a.fecha);

    switch (filtroPeriodo) {

      case 'dia':
        return a.fecha === getFechaHoy();

      case 'semana': {
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(
          hoy.getDate() - hoy.getDay()
        );
        return fechaRegistro >= inicioSemana;
      }

      case 'mes':
        return (
          fechaRegistro.getMonth() === hoy.getMonth() &&
          fechaRegistro.getFullYear() === hoy.getFullYear()
        );

      case 'anio':
        return fechaRegistro.getFullYear() === hoy.getFullYear();

      default:
        return true;
    }

  });

  // FILTRO POR GRADO
  if (filtroGrado) {
    datos = datos.filter(a => a.grado === filtroGrado);
  }

  return datos;
}
export function exportarAsistenciaCSV() {

  const datos = obtenerAsistenciaFiltrada();

  if (!datos.length) {
    alert('No hay registros para exportar');
    return;
  }

  const encabezado =
    'Fecha,Hora,Nombre,Grado,Tipo\n';

  const filas = datos.map(a =>
    `"${a.fecha}","${a.hora}","${a.nombre}","${a.grado}","${a.tipo}"`
  );

  const csv =
    encabezado + filas.join('\n');

  const blob = new Blob(
    [csv],
    { type: 'text/csv;charset=utf-8;' }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement('a');

  link.href = url;

  link.download =
    `asistencia_${Date.now()}.csv`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
export function exportarAsistenciaExcel() {
  if (typeof XLSX === 'undefined') {
    showToast('No se pudo cargar el módulo de Excel (sin conexión)', 'error');
    return;
  }
  if (!state.estudiantes.length) {
    alert('No hay estudiantes registrados');
    return;
  }

  const grado = document.getElementById('filtro-grado')?.value || '';
  const hoy   = getFechaHoy();

  const wb = XLSX.utils.book_new();
  _agregarHojaDia(wb, 'Hoy', hoy, grado);
  _agregarHojaRango(wb, 'Mes', _inicioMes(), hoy, grado);
  _agregarHojaRango(wb, 'Año', _inicioAnio(), hoy, grado);
  wb.Workbook = { Views: [{ activeTab: 0 }] };

  const sufijoCurso = grado ? '_' + grado.replace('°', '') : '';
  XLSX.writeFile(wb, `asistencia${sufijoCurso}_${hoy}.xlsx`);
}

function _inicioMes() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
}

function _inicioAnio() {
  return new Date().getFullYear() + '-01-01';
}

function _rosterCurso(grado) {
  return state.estudiantes
    .filter(e => (!grado || e.grado === grado) && e.activo !== false)
    .sort((a, b) => (a.apellidos + a.nombres).localeCompare(b.apellidos + b.nombres));
}

function _agregarHojaDia(wb, nombreHoja, fecha, grado) {
  const roster = _rosterCurso(grado);
  const registrosHoy = state.asistencia.filter(a => a.fecha === fecha && (!grado || a.grado === grado));

  const horasPorEstudiante = {};
  registrosHoy.forEach(r => {
    const h = (horasPorEstudiante[r.estudianteId] ||= {});
    if (r.tipo === 'entrada') h.entrada = r.hora; else h.salida = r.hora;
  });

  const vinieron = roster.filter(e => horasPorEstudiante[e.id]?.entrada).length;
  const faltaron = roster.length - vinieron;

  const rows = [
    [`Reporte de Asistencia - ${nombreHoja}`],
    [`Fecha: ${fechaLegible(fecha)}`],
    [`Curso: ${grado || 'Todos'}`],
    [],
    ['Total estudiantes', roster.length, 'Asistieron', vinieron, 'Faltaron', faltaron],
    [],
    ['Estado', 'Nombre', 'Documento', 'Grado', 'Grupo', 'Hora Entrada', 'Hora Salida']
  ];

  roster.forEach(e => {
    const h = horasPorEstudiante[e.id] || {};
    rows.push([h.entrada ? 'Asistió' : 'Faltó', `${e.nombres} ${e.apellidos}`, e.documento, e.grado, e.grupo, h.entrada || '', h.salida || '']);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 9 }, { wch: 28 }, { wch: 14 }, { wch: 7 }, { wch: 7 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
}

function _agregarHojaRango(wb, nombreHoja, desde, hasta, grado) {
  const roster = _rosterCurso(grado);
  const registros = state.asistencia
    .filter(a => a.fecha >= desde && a.fecha <= hasta && (!grado || a.grado === grado))
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

  const fechasConRegistro = [...new Set(registros.map(r => r.fecha))].sort();

  const rows = [
    [`Reporte de Asistencia - ${nombreHoja}`],
    [`Curso: ${grado || 'Todos'}`],
    [`Periodo: ${fechaLegible(desde)} a ${fechaLegible(hasta)}`],
    [],
    ['Total estudiantes en curso', roster.length, 'Días con registro', fechasConRegistro.length, 'Total registros', registros.length],
    [],
    ['Resumen por día'],
    ['Fecha', 'Vinieron', 'Faltaron', 'Total curso']
  ];

  fechasConRegistro.forEach(f => {
    const entradasDia = new Set(
      registros.filter(r => r.fecha === f && r.tipo === 'entrada').map(r => r.estudianteId)
    );
    const vinieron = roster.filter(e => entradasDia.has(e.id)).length;
    rows.push([fechaLegible(f), vinieron, roster.length - vinieron, roster.length]);
  });

  rows.push([]);
  rows.push(['Detalle de registros']);
  rows.push(['Fecha', 'Hora', 'Nombre', 'Documento', 'Grado', 'Grupo', 'Tipo']);
  registros.forEach(r => {
    const est = state.estudiantes.find(e => e.id === r.estudianteId);
    rows.push([fechaLegible(r.fecha), r.hora, r.nombre, est?.documento || '', r.grado, est?.grupo || '', r.tipo === 'entrada' ? 'Entrada' : 'Salida']);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 28 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
}

export function filtrarAsistencia() {

  const lista = document.getElementById('lista-asistencia');

  const registros = obtenerAsistenciaFiltrada();

  document.getElementById('contador-asistencia')
    .textContent = `Total registros: ${registros.length}`;

  if (!registros.length) {

    lista.innerHTML = `
      <div class="empty-state" style="padding:20px">
        <i class="ti ti-scan" style="font-size:28px"></i>
        Sin registros
      </div>
    `;

    return;
  }

  lista.innerHTML = registros.map(a => `
    <div class="timeline-item">
      <div class="timeline-dot ${
        a.tipo === 'entrada'
          ? 'dot-green'
          : 'dot-red'
      }"></div>

      <div style="flex:1">
        <div style="font-size:13px;font-weight:500">
          ${a.nombre}
        </div>

        <div style="font-size:11px;color:var(--color-text-secondary)">
          ${a.fecha} ·
          Grado ${a.grado} ·
          ${a.tipo === 'entrada' ? 'Entrada' : 'Salida'} ·
          ${a.hora}
        </div>
      </div>

      <span class="badge ${
        a.tipo === 'entrada'
          ? 'badge-green'
          : 'badge-red'
      }">
        ${a.tipo === 'entrada'
          ? '↑ Entrada'
          : '↓ Salida'}
      </span>
    </div>
  `).join('');

}