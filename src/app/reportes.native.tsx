
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  obtenerReportesLocales,
  reactivarCola,
} from '@/database/sqlite';

import { useAuth } from '@/context/AuthContext';
import type { ReporteLocal } from '@/models/offline';
import { sincronizarPendientes } from '@/services/syncService';

export default function ReportesNativos() {
  const router = useRouter();
  const { usuario } = useAuth();

  const [reportes, setReportes] = useState<ReporteLocal[]>([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [sincronizando, setSincronizando] = useState(false);

  const bloqueoSync = useRef(false);

  const refrescar = useCallback(async () => {
    if (!usuario) {
      setReportes([]);
      return;
    }

    try {
      const datos = await obtenerReportesLocales(usuario.id);
      setReportes(datos);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pueden leer los reportes locales'
      );
    }
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      void refrescar();
    }, [refrescar])
  );

  async function sincronizar() {
    if (!usuario || bloqueoSync.current) return;

    bloqueoSync.current = true;
    setSincronizando(true);
    setError('');
    setMensaje('Comprobando conexión...');

    try {
      const conexion = await NetInfo.fetch();

      if (conexion.isConnected !== true) {
        setMensaje(
          'Sin conexión. Tus reportes siguen guardados en el teléfono.'
        );
        return;
      }

      // Reactivar los registros pendientes para intentar
      // sincronizarlos inmediatamente.
      await reactivarCola(usuario.id);

      setMensaje('Sincronizando reportes...');

      const resultado = await sincronizarPendientes();

      // Actualizar la lista con los datos reales de SQLite.
      const actualizados = await obtenerReportesLocales(usuario.id);

      setReportes(actualizados);

      const pendientes = actualizados.filter(
        (r) => r.sincronizado !== 1
      ).length;

      if (resultado.error) {
        setError(resultado.error);
        setMensaje(
          'No se completó la sincronización. Tus datos siguen guardados.'
        );
      } else if (pendientes === 0) {
        setMensaje(
          '✓ Todo sincronizado. No hay reportes pendientes.'
        );
      } else if (resultado.procesados > 0) {
        setMensaje(
          `Se procesaron ${resultado.procesados} operaciones. ` +
          `Quedan ${pendientes} reportes pendientes.`
        );
      } else {
        setMensaje(
          'No se enviaron operaciones nuevas. ' +
          'Puede haber una sincronización automática en curso.'
        );
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo sincronizar'
      );

      setMensaje(
        'La sincronización no se completó. Los reportes siguen en SQLite.'
      );
    } finally {
      bloqueoSync.current = false;
      setSincronizando(false);
    }
  }

  const pendientes = reportes.filter(
    (r) => r.sincronizado !== 1
  ).length;

  return (
    <ScrollView
      style={s.pantalla}
      contentContainerStyle={s.contenido}
    >
      <Text style={s.titulo}>Mis reportes</Text>

      <Text style={s.resumen}>
        Reportes pendientes: {pendientes}
      </Text>

      <Pressable
        style={s.botonNuevo}
        accessibilityRole="button"
        onPress={() => router.push('/reporte/nuevo')}
      >
        <Text style={s.textoNuevo}>
          + Nuevo reporte
        </Text>
      </Pressable>

      <Pressable
        style={[
          s.botonSync,
          sincronizando && s.botonDeshabilitado,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: sincronizando }}
        disabled={sincronizando}
        onPress={() => void sincronizar()}
      >
        {sincronizando ? (
          <View style={s.fila}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={s.textoBlanco}>
              Sincronizando...
            </Text>
          </View>
        ) : (
          <Text style={s.textoBlanco}>
            ↻ Sincronizar ahora
          </Text>
        )}
      </Pressable>

      {mensaje ? (
        <Text style={s.mensaje}>
          {mensaje}
        </Text>
      ) : null}

      {error ? (
        <Text style={s.error}>
          Error: {error}
        </Text>
      ) : null}

      {reportes.map((r) => (
        <View
          style={s.card}
          key={r.id_local}
        >
          <Text style={s.negrita}>
            {r.titulo}
          </Text>

          <Text>
            Equipo #{r.equipo_id} · Prioridad {r.prioridad}
          </Text>

          <Text>{r.descripcion}</Text>

          <Text
            style={
              r.sincronizado === 1
                ? s.sincronizado
                : s.pendiente
            }
          >
            {r.sincronizado === 1
              ? '✓ Sincronizado'
              : '⌛ Pendiente de sincronización'}
          </Text>
        </View>
      ))}

      {reportes.length === 0 && (
        <Text>
          No hay reportes guardados en este teléfono.
        </Text>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#F1F4F8',
  },
  contenido: {
    padding: 16,
    gap: 12,
  },
  titulo: {
    fontSize: 22,
    color: '#142B45',
    fontWeight: '800',
  },
  resumen: {
    fontSize: 14,
    color: '#475569',
  },
  botonNuevo: {
    minWidth: 48,
    minHeight: 50,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonSync: {
    minWidth: 48,
    minHeight: 54,
    backgroundColor: '#15803D',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoNuevo: {
    fontWeight: '800',
    color: '#142B45',
  },
  textoBlanco: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  mensaje: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '600',
  },
  error: {
    color: '#B91C1C',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  negrita: {
    fontWeight: '700',
    color: '#142B45',
    fontSize: 16,
  },
  sincronizado: {
    color: '#15803D',
    fontWeight: '700',
  },
  pendiente: {
    color: '#B45309',
    fontWeight: '700',
  },
});
