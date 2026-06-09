// navegacion.js — Navegación entre páginas

import { renderCarnets }                                         from './carnets.js';
import { renderReportes, renderDashboard }                       from './reportes.js';
import { renderAsistencia, renderSelectEstudiantes, focusScanInput } from './asistencia.js';

export function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelector('[data-page="' + name + '"]').classList.add('active');

  if (name === 'carnets')    renderCarnets();
  if (name === 'reportes')   renderReportes();
  if (name === 'dashboard')  renderDashboard();
  if (name === 'asistencia') {
    renderAsistencia();
    renderSelectEstudiantes();
    setTimeout(() => focusScanInput(), 300);
  }
}