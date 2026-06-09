// reportes.js — Dashboard, estadísticas y exportación

import { getFechaHoy, fechaLegible } from './utils.js';
import { state } from './state.js';

export function renderDashboard() {
  const hoy = getFechaHoy();
  document.getElementById('stat-total').textContent      = state.estudiantes.length;
  document.getElementById('stat-carnets').textContent    = state.estudiantes.length;
  document.getElementById('stat-asistencia').textContent = state.asistencia.filter(a => a.fecha === hoy).length;
  document.getElementById('stat-fecha').textContent      = fechaLegible(hoy);

  const hoyItems = state.asistencia.filter(a => a.fecha === hoy).slice(0, 6);
  document.getElementById('timeline-asistencia').innerHTML = hoyItems.length
    ? hoyItems.map(a => `
        <div class="timeline-item">
          <div class="timeline-dot ${a.tipo === 'entrada' ? 'dot-green' : 'dot-red'}"></div>
          <div>
            <div style="font-size:12px;font-weight:500">${a.nombre}</div>
            <div style="font-size:11px;color:var(--color-text-secondary)">${a.tipo === 'entrada' ? 'Entrada' : 'Salida'} · ${a.hora}</div>
          </div>
        </div>`).join('')
    : '<div class="empty-state" style="padding:20px"><i class="ti ti-scan" style="font-size:28px"></i>Sin registros hoy</div>';

  _renderBarChart('grados-chart');
}

export function renderReportes() {
  _renderBarChart('reporte-grados');
  _renderResumen();
  _renderTablaCompleta();
}

function _renderBarChart(containerId) {
  const grados = ['6°', '7°', '8°', '9°', '10°', '11°'];
  const counts = grados.map(g => state.estudiantes.filter(e => e.grado === g).length);
  const max    = Math.max(...counts, 1);
  const small  = containerId === 'grados-chart';
  document.getElementById(containerId).innerHTML = grados.map((g, i) => `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:${small ? 8 : 10}px">
      <span style="font-size:${small ? 12 : 13}px;width:${small ? 28 : 32}px;color:var(--color-text-secondary)">${g}</span>
      <div style="flex:1;background:var(--color-background-secondary,#f0f0f0);border-radius:4px;height:${small ? 18 : 20}px;overflow:hidden">
        <div style="height:100%;width:${Math.round(counts[i] / max * 100)}%;background:#0F6E56;border-radius:4px;transition:width 0.4s"></div>
      </div>
      <span style="font-size:${small ? 12 : 13}px;font-weight:600;min-width:${small ? 18 : 22}px">${counts[i]}</span>
    </div>`).join('') || '<p style="color:var(--color-text-secondary);font-size:13px">Sin datos</p>';
}

function _renderResumen() {
  const hoy = getFechaHoy();
  const filas = [
    ['Total estudiantes',          state.estudiantes.length],
    ['Estudiantes activos',        state.estudiantes.filter(e => e.activo).length],
    ['Asistencia hoy',             state.asistencia.filter(a => a.fecha === hoy).length],
    ['Total registros asistencia', state.asistencia.length]
  ];
  document.getElementById('reporte-resumen').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px">
      ${filas.map(([label, val]) => `
        <div style="display:flex;justify-content:space-between;padding:10px;background:var(--color-background-secondary,#f5f5f0);border-radius:8px">
          <span style="font-size:13px;color:var(--color-text-secondary)">${label}</span>
          <span style="font-size:15px;font-weight:600">${val}</span>
        </div>`).join('')}
    </div>`;
}

function _renderTablaCompleta() {
  document.getElementById('reporte-tbody').innerHTML = state.estudiantes.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${e.nombres} ${e.apellidos}</td>
      <td style="font-family:monospace;font-size:12px">${e.documento}</td>
      <td><span class="badge badge-green">${e.grado} ${e.grupo}</span></td>
      <td style="font-family:monospace;font-size:11px">${e.codigo}</td>
      <td>${e.acudiente || '—'}</td>
    </tr>`).join('')
    || '<tr><td colspan="6" style="text-align:center;color:var(--color-text-secondary);padding:20px">Sin estudiantes registrados</td></tr>';
}

export function exportarCSV() {
  if (!state.estudiantes.length) { alert('No hay datos para exportar.'); return; }
  const headers = ['Nombres', 'Apellidos', 'Documento', 'Grado', 'Grupo', 'Código', 'Acudiente', 'Teléfono'];
  const rows    = state.estudiantes.map(e => [e.nombres, e.apellidos, e.documento, e.grado, e.grupo, e.codigo, e.acudiente || '', e.telefono || '']);
  const csv     = [headers, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob    = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const a       = document.createElement('a');
  a.href        = URL.createObjectURL(blob);
  a.download    = 'estudiantes_IET_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
}