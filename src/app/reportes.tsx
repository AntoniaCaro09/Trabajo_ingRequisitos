import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { crearReporte, obtenerEquipos, obtenerReportes, USUARIO_DEMO_ID, type Equipo, type Reporte } from '@/service/api';
import { ui } from '@/constants/mobile-ui';

const PRIORIDADES: Reporte['prioridad'][] = ['baja','media','alta','critica'];
export default function ReportesScreen() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [equipoId, setEquipoId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<Reporte['prioridad']>('media');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const refrescar = useCallback(async () => {
    setCargando(true); setError('');
    try {
      const [e, r] = await Promise.all([obtenerEquipos(), obtenerReportes()]);
      setEquipos(e); setReportes(r);
    } catch (err) { setError(err instanceof Error ? err.message : 'Error de carga'); }
    finally { setCargando(false); }
  }, []);
  useFocusEffect(useCallback(() => { void refrescar(); }, [refrescar]));

  async function guardar() {
    if (!equipoId || !titulo.trim() || !descripcion.trim()) {
      Alert.alert('Faltan datos', 'Selecciona el equipo y completa título y descripción.'); return;
    }
    if (!USUARIO_DEMO_ID) {
      Alert.alert('Falta configurar usuario', 'Define EXPO_PUBLIC_DEMO_USER_ID en el archivo .env de Expo con el ID del usuario de prueba.'); return;
    }
    setGuardando(true); setError('');
    try {
      await crearReporte({ equipo_id: equipoId, usuario_id: USUARIO_DEMO_ID,
        titulo: titulo.trim(), descripcion: descripcion.trim(), prioridad });
      setTitulo(''); setDescripcion(''); setEquipoId(''); setPrioridad('media'); setMostrarFormulario(false);
      await refrescar();
      Alert.alert('Reporte guardado', 'El reporte quedó registrado en PostgreSQL.');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar'); }
    finally { setGuardando(false); }
  }
  const nombres = Object.fromEntries(equipos.map(e => [String(e.id), e.nombre]));
  return <ScrollView style={ui.screen} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
    <Text style={ui.title}>Reportes de fallas</Text>
    <Text style={ui.hint}>Registra una anomalía y consulta los reportes de planta.</Text>
    <Pressable style={ui.button} onPress={() => setMostrarFormulario(x=>!x)}>
      <Text style={ui.buttonText}>{mostrarFormulario ? 'Ocultar formulario' : '+ Reportar falla'}</Text>
    </Pressable>
    {mostrarFormulario && <View style={ui.card}>
      <Text style={ui.bold}>Nuevo reporte</Text>
      <Text style={ui.label}>Equipo</Text>
      <View style={ui.options}>{equipos.map(e => <Pressable key={e.id} style={[ui.option, equipoId===String(e.id)&&ui.selected]} onPress={()=>setEquipoId(String(e.id))}>
        <Text style={[ui.optionText, equipoId===String(e.id)&&ui.selectedText]}>{e.codigo_interno} · {e.nombre}</Text>
      </Pressable>)}</View>
      <Text style={ui.label}>Título de la falla</Text>
      <TextInput accessibilityLabel="Título de la falla" style={ui.input} value={titulo} onChangeText={setTitulo} maxLength={150} placeholder="Ej. Vibración del motor" />
      <Text style={ui.label}>Descripción</Text>
      <TextInput accessibilityLabel="Descripción de la falla" style={[ui.input,{height:105,textAlignVertical:'top'}]} multiline value={descripcion} onChangeText={setDescripcion} maxLength={3000} placeholder="¿Qué ocurrió y dónde?" />
      <Text style={ui.label}>Prioridad</Text>
      <View style={ui.options}>{PRIORIDADES.map(p => <Pressable key={p} style={[ui.option, prioridad===p&&ui.selected]} onPress={()=>setPrioridad(p)}>
        <Text style={[ui.optionText, prioridad===p&&ui.selectedText]}>{p.toUpperCase()}</Text>
      </Pressable>)}</View>
      <Pressable disabled={guardando} style={[ui.button,guardando&&{opacity:0.5}]} onPress={guardar}><Text style={ui.buttonText}>{guardando?'Guardando...':'Guardar reporte'}</Text></Pressable>
    </View>}
    {error ? <Text style={ui.error}>{error}</Text> : null}
    <Pressable onPress={refrescar} style={ui.secondaryButton}><Text>Actualizar reportes</Text></Pressable>
    <Text style={[ui.bold,{marginVertical:15}]}>Reportes registrados ({reportes.length})</Text>
    {cargando && <ActivityIndicator />}
    {!cargando && reportes.length===0 && <Text style={ui.meta}>Todavía no hay reportes registrados.</Text>}
    {reportes.map(r => <View key={r.id} style={ui.card}>
      <Text style={ui.bold}>#{r.id} · {r.titulo}</Text>
      <Text style={ui.meta}>{nombres[String(r.equipo_id)] || `Equipo ${r.equipo_id}`}</Text>
      <Text style={ui.meta}>Prioridad: {r.prioridad} · Estado: {r.estado}</Text>
      <Text style={[ui.meta,{color:'#334155'}]}>{r.descripcion}</Text>
    </View>)}
  </ScrollView>;
}
