import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  actualizarEstadoOrden,
  obtenerEquipos,
  obtenerOrdenes,
  obtenerTecnicos,
  type Equipo,
  type Orden,
  type Tecnico,
} from '@/service/api';
import { ui } from '@/constants/mobile-ui';

const TRANSICIONES: Record<Orden['estado'], Orden['estado'][]> = {
  pendiente: ['en_progreso', 'cancelada'],
  asignada: ['en_progreso', 'cancelada'],
  en_progreso: ['pausada', 'completada'],
  pausada: ['en_progreso', 'cancelada'],
  completada: [],
  cancelada: [],
};

const ETIQUETAS: Record<Orden['estado'], string> = {
  pendiente: 'Pendiente',
  asignada: 'Asignada',
  en_progreso: 'En proceso',
  pausada: 'Pausada',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

function etiquetaAccion(destino: Orden['estado'], origen: Orden['estado']): string {
  if (destino === 'en_progreso') return origen === 'pausada' ? 'Reanudar' : 'Iniciar';
  if (destino === 'pausada') return 'Pausar';
  if (destino === 'completada') return 'Completar';
  if (destino === 'cancelada') return 'Cancelar';
  return ETIQUETAS[destino];
}

export default function OrdenesScreen() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [cargando, setCargando] = useState(false);
  const [operando, setOperando] = useState<string | null>(null);
  const [error, setError] = useState('');

  const refrescar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [listaOrdenes, listaEquipos, listaTecnicos] = await Promise.all([
        obtenerOrdenes(),
        obtenerEquipos(),
        obtenerTecnicos(),
      ]);
      setOrdenes(listaOrdenes);
      setEquipos(listaEquipos);
      setTecnicos(listaTecnicos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las órdenes.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refrescar();
    }, [refrescar])
  );

  async function cambiar(id: string, nuevoEstado: Orden['estado']) {
    if (operando !== null) return;
    setOperando(id);
    setError('');

    try {
      // El servidor confirma el cambio y devuelve únicamente la orden actualizada.
      const ordenActualizada = await actualizarEstadoOrden(id, nuevoEstado);

      // Actualizar solo la orden pulsada; las demás no cambian.
      setOrdenes((actuales) =>
        actuales.map((orden) =>
          String(orden.id) === id
            ? { ...orden, ...ordenActualizada }
            : orden
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la orden.');
    } finally {
      setOperando(null);
    }
  }

  function confirmarCambio(orden: Orden, nuevoEstado: Orden['estado']) {
    const id = String(orden.id);
    if (operando !== null) return;

    // Alert.alert no proporciona una confirmación funcional en Expo Web.
    if (Platform.OS === 'web') {
      void cambiar(id, nuevoEstado);
      return;
    }

    Alert.alert(
      'Confirmar cambio',
      `¿Cambiar OT #${id} a ${ETIQUETAS[nuevoEstado]}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => void cambiar(id, nuevoEstado) },
      ]
    );
  }

  const nombres = Object.fromEntries(
    equipos.map((equipo) => [String(equipo.id), equipo.nombre])
  );
  const asignados = Object.fromEntries(
    tecnicos.map((tecnico) => [
      String(tecnico.id),
      `${tecnico.nombre} ${tecnico.apellido}`,
    ])
  );

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Text style={ui.title}>Órdenes de trabajo</Text>
      <Text style={ui.hint}>
        Consulta las órdenes creadas por supervisión y registra su avance.
      </Text>

      <Pressable
        style={ui.secondaryButton}
        onPress={() => void refrescar()}
        disabled={cargando || operando !== null}
        accessibilityRole="button"
        accessibilityLabel="Actualizar órdenes"
      >
        <Text>Actualizar órdenes</Text>
      </Pressable>

      {error ? <Text style={ui.error}>{error}</Text> : null}
      {cargando ? <ActivityIndicator style={{ marginTop: 15 }} /> : null}

      {!cargando && ordenes.length === 0 ? (
        <Text style={[ui.meta, { marginTop: 15 }]}>
          Aún no hay órdenes. Primero crea un reporte y asígnalo desde el panel web.
        </Text>
      ) : null}

      {ordenes.map((orden) => {
        const id = String(orden.id);
        const guardando = operando === id;
        const completada = orden.estado === 'completada';
        const transiciones = TRANSICIONES[orden.estado] ?? [];

        return (
          <View key={id} style={ui.card}>
            <Text style={ui.bold}>OT #{id} · {orden.titulo}</Text>
            <Text style={ui.meta}>
              Equipo: {nombres[String(orden.equipo_id)] ?? String(orden.equipo_id)}
            </Text>
            <Text style={ui.meta}>
              Técnico: {asignados[String(orden.usuario_asignado_id)] ?? 'Sin asignar'}
            </Text>
            <Text style={ui.meta}>
              Prioridad: {orden.prioridad} · Estado: {ETIQUETAS[orden.estado]}
            </Text>

            {completada ? (
              <Pressable
                disabled
                accessibilityRole="button"
                accessibilityLabel={`Orden ${id} completada. Todo listo`}
                accessibilityState={{ disabled: true }}
                style={[ui.option, styles.boton, styles.botonCompletado]}
              >
                <Text style={[ui.optionText, styles.textoCompletado]}>
                  ✓  Todo listo
                </Text>
              </Pressable>
            ) : transiciones.length > 0 ? (
              <View style={[ui.options, styles.acciones]}>
                {transiciones.map((destino) => {
                  const esCompletar = destino === 'completada';
                  const deshabilitado = operando !== null;
                  const texto = guardando
                    ? 'Guardando...'
                    : etiquetaAccion(destino, orden.estado);

                  return (
                    <Pressable
                      key={destino}
                      accessibilityRole="button"
                      accessibilityLabel={`${etiquetaAccion(destino, orden.estado)} orden ${id}`}
                      accessibilityState={{ disabled: deshabilitado, busy: guardando }}
                      disabled={deshabilitado}
                      onPress={() => confirmarCambio(orden, destino)}
                      style={({ pressed }) => [
                        ui.option,
                        styles.boton,
                        esCompletar && styles.botonCompletar,
                        pressed && styles.presionado,
                        deshabilitado && styles.deshabilitado,
                      ]}
                    >
                      <Text
                        style={[
                          ui.optionText,
                          esCompletar && styles.textoCompletar,
                        ]}
                      >
                        {texto}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}

      <Text style={ui.hint}>
        Modo de pruebas local: los permisos de usuario todavía no están implementados.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  acciones: { marginTop: 12 },
  boton: {
    minHeight: 48,
    minWidth: 110,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  botonCompletar: { borderColor: '#16A34A' },
  textoCompletar: { color: '#166534', fontWeight: '700' },
  botonCompletado: { backgroundColor: '#22C55E', borderColor: '#16A34A' },
  textoCompletado: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  presionado: { opacity: 0.75 },
  deshabilitado: { opacity: 0.55 },
});
