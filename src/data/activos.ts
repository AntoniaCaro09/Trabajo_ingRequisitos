// Equipos de demostración: aún NO están conectados a una base de datos.
export type Activo = {
  id: string;
  nombre: string;
  area: string;
  estado: "Operativo" | "En mantenimiento" | "Detenido";
  ubicacion: string;
  descripcion: string;
};

export const activosEjemplo: Activo[] = [
  { id: "EQ-001", nombre: "Extrusora 01", area: "Extrusión", estado: "Operativo", ubicacion: "Nave A", descripcion: "Máquina utilizada para procesar plástico por extrusión." },
  { id: "EQ-002", nombre: "Inyectora 02", area: "Inyección", estado: "En mantenimiento", ubicacion: "Nave B", descripcion: "Máquina de moldeo por inyección de plástico." },
  { id: "EQ-003", nombre: "Compresor de aire", area: "Servicios industriales", estado: "Operativo", ubicacion: "Sala de compresores", descripcion: "Proporciona aire comprimido a la planta." },
  { id: "EQ-004", nombre: "Cinta transportadora 01", area: "Embalaje", estado: "Detenido", ubicacion: "Línea 1", descripcion: "Transporta productos entre estaciones de embalaje." },
  { id: "EQ-005", nombre: "Montacargas 01", area: "Logística", estado: "Operativo", ubicacion: "Bodega", descripcion: "Equipo para transportar materiales y pallets." },
];
