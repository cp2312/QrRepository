// utils.js — Funciones utilitarias

export function genId() {
  return 'EST' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
}

export function genCodigo(documento) {
  return 'IET' + documento.toString().replace(/\D/g, '').slice(-6).padStart(6, '0');
}

export function showToast(msg, tipo = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  const estilos = {
    error: { bg: '#FCEBEB', color: '#A32D2D', border: '0.5px solid #F09595' },
    ok:    { bg: '#E1F5EE', color: '#085041', border: '0.5px solid #5DCAA5' },
    info:  { bg: '#f5f5f0', color: '#333',    border: '0.5px solid #ccc'    }
  };
  const s = estilos[tipo] || estilos.info;
  t.style.background = s.bg;
  t.style.color      = s.color;
  t.style.border     = s.border;
  t.style.display    = 'block';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => (t.style.display = 'none'), 3000);
}

export function getFechaHoy() {
  const d = new Date();
  return d.getFullYear() + '-'
    + String(d.getMonth() + 1).padStart(2, '0') + '-'
    + String(d.getDate()).padStart(2, '0');
}

export function getHoraAhora() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export function fechaLegible(f) {
  if (!f) return '';
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}