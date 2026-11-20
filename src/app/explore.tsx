import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Activo, activosEjemplo } from "@/data/activos";

export default function ActivosScreen() {
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState<Activo | null>(null);

  // Filtra los equipos cuando se escribe en el buscador.
  const resultados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase();
    if (!texto) return activosEjemplo;
    return activosEjemplo.filter((activo) =>
      [activo.nombre, activo.id, activo.area, activo.ubicacion]
        .some((valor) => valor.toLocaleLowerCase().includes(texto))
    );
  }, [busqueda]);

  return (
    <SafeAreaView style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Activos industriales</Text>
        <Text style={styles.subtitulo}>
          Busca una máquina y toca su tarjeta para ver la ficha técnica.
        </Text>
        <TextInput
          style={styles.buscador}
          placeholder="Buscar nombre, código o área..."
          placeholderTextColor="#64748B"
          value={busqueda}
          onChangeText={setBusqueda}
          autoCapitalize="none"
          accessibilityLabel="Buscar activos"
        />
        <Text style={styles.contador}>{resultados.length} equipo(s) encontrado(s)</Text>
        {resultados.map((activo) => (
          <Pressable
            key={activo.id}
            style={styles.tarjeta}
            onPress={() => setSeleccionado(activo)}
            accessibilityRole="button"
            accessibilityLabel={`Ver ficha de ${activo.nombre}`}
          >
            <View style={styles.fila}>
              <Text style={styles.codigo}>{activo.id}</Text>
              <Text style={[styles.estado, activo.estado === "Operativo" ? styles.verde : activo.estado === "Detenido" ? styles.rojo : styles.amarillo]}>
                {activo.estado}
              </Text>
            </View>
            <Text style={styles.nombre}>{activo.nombre}</Text>
            <Text style={styles.detalle}>{activo.area} · {activo.ubicacion}</Text>
            <Text style={styles.ver}>Ver ficha ›</Text>
          </Pressable>
        ))}
        {resultados.length === 0 && (
          <Text style={styles.vacio}>No hay máquinas que coincidan con tu búsqueda.</Text>
        )}
        <Text style={styles.aviso}>
          DEMOSTRACIÓN: los equipos son datos de ejemplo. Aún no se guardan en SQLite ni se sincronizan con el servidor.
        </Text>
      </ScrollView>
      <Modal visible={seleccionado !== null} transparent animationType="fade" onRequestClose={() => setSeleccionado(null)}>
        <View style={styles.fondoModal}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Ficha del equipo</Text>
            {seleccionado && (
              <>
                <Text style={styles.nombre}>{seleccionado.nombre}</Text>
                <Text style={styles.modalDato}>Código: {seleccionado.id}</Text>
                <Text style={styles.modalDato}>Área: {seleccionado.area}</Text>
                <Text style={styles.modalDato}>Ubicación: {seleccionado.ubicacion}</Text>
                <Text style={styles.modalDato}>Estado: {seleccionado.estado}</Text>
                <Text style={styles.modalDato}>Descripción: {seleccionado.descripcion}</Text>
              </>
            )}
            <Pressable style={styles.botonCerrar} onPress={() => setSeleccionado(null)} accessibilityRole="button">
              <Text style={styles.botonTexto}>Cerrar ficha</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: "#F1F4F8" },
  contenido: { padding: 20, paddingBottom: 90 },
  titulo: { fontSize: 27, fontWeight: "bold", color: "#142B45", marginTop: 22 },
  subtitulo: { color: "#64748B", marginTop: 8, fontSize: 15, marginBottom: 18 },
  buscador: { backgroundColor: "#FFFFFF", borderColor: "#CBD5E1", borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 14, fontSize: 16, color: "#142B45" },
  contador: { color: "#64748B", fontSize: 13, marginVertical: 14 },
  tarjeta: { backgroundColor: "#FFFFFF", padding: 18, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: "#F59E0B" },
  fila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  codigo: { color: "#475569", fontSize: 13, fontWeight: "600" },
  estado: { fontSize: 11, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 8, overflow: "hidden" },
  verde: { backgroundColor: "#DCFCE7", color: "#166534" },
  amarillo: { backgroundColor: "#FEF3C7", color: "#92400E" },
  rojo: { backgroundColor: "#FEE2E2", color: "#991B1B" },
  nombre: { fontSize: 19, fontWeight: "bold", color: "#142B45", marginTop: 10 },
  detalle: { color: "#64748B", marginTop: 6, fontSize: 14 },
  ver: { color: "#0369A1", fontWeight: "600", marginTop: 11 },
  vacio: { padding: 18, textAlign: "center", color: "#64748B" },
  aviso: { color: "#64748B", fontSize: 12, marginTop: 14, lineHeight: 18 },
  fondoModal: { flex: 1, backgroundColor: "#00000099", justifyContent: "center", padding: 24 },
  modal: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24 },
  modalTitulo: { color: "#64748B", fontSize: 14, fontWeight: "600" },
  modalDato: { color: "#334155", fontSize: 15, marginTop: 12 },
  botonCerrar: { backgroundColor: "#142B45", padding: 15, borderRadius: 10, marginTop: 24, alignItems: "center" },
  botonTexto: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
});
