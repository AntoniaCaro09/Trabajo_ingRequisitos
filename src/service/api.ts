
const API_URL = 'http://localhost:3001';

export type Equipo = {
  id: string;
  codigo_interno: string;
  codigo_qr: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  area: string;
};

export async function obtenerEquipos(): Promise<Equipo[]> {
  const respuesta = await fetch(`${API_URL}/api/equipos`);

  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar los equipos');
  }

  const equipos: Equipo[] = await respuesta.json();

  return equipos;
}
