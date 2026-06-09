// db.js — Operaciones de base de datos con Firestore

export async function fbSaveEstudiante(estudiante) {
  const { doc, setDoc } = window._fs;
  await setDoc(doc(window._db, 'estudiantes', estudiante.id), estudiante);
}

export async function fbDeleteEstudiante(id) {
  const { doc, deleteDoc } = window._fs;
  await deleteDoc(doc(window._db, 'estudiantes', id));
}

export async function fbSaveAsistencia(registro) {
  const { doc, setDoc } = window._fs;
  await setDoc(doc(window._db, 'asistencia', 'asis_' + registro.id), registro);
}

export async function fbDeleteAsistenciaHoy(fecha) {
  const { collection, getDocs, doc, deleteDoc } = window._fs;
  const snap = await getDocs(collection(window._db, 'asistencia'));
  for (const d of snap.docs) {
    if (d.data().fecha === fecha) {
      await deleteDoc(doc(window._db, 'asistencia', d.id));
    }
  }
}

export function initListeners(onEstudiantes, onAsistencia) {
  const { collection, onSnapshot, query, orderBy } = window._fs;
  const db = window._db;

  onSnapshot(collection(db, 'estudiantes'), snap => {
    onEstudiantes(snap.docs.map(d => d.data()));
  });

  onSnapshot(query(collection(db, 'asistencia'), orderBy('id', 'desc')), snap => {
    onAsistencia(snap.docs.map(d => d.data()));
  });
}