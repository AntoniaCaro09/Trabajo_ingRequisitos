import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PhotoEvidence, usePhotoEvidence } from '@/components/PhotoEvidence';
import { abrirDB, crearReporteOffline, obtenerActivosLocales } from '@/database/sqlite';
import { useAuth } from '@/context/AuthContext';
import type { Activo, Prioridad } from '@/models/offline';
import { sincronizarPendientes } from '@/services/syncService';

const prioridades:Prioridad[]=['baja','media','alta','critica'];
export default function NuevoReporte() {
  const router=useRouter();
  const {equipoId}=useLocalSearchParams<{equipoId?:string}>();
  const {usuario,tieneRol}=useAuth();
  const [activos,setActivos]=useState<Activo[]>([]);
  const [seleccion,setSeleccion]=useState(equipoId||'');
  const [titulo,setTitulo]=useState('');
  const [descripcion,setDescripcion]=useState('');
  const [prioridad,setPrioridad]=useState<Prioridad>('media');
  const [guardando,setGuardando]=useState(false);
  const [mensaje,setMensaje]=useState('');
  const evidencia=usePhotoEvidence();
  const permitido=tieneRol('OPERARIO','TECNICO','SUPERVISOR','ADMIN');
  useEffect(()=>{void abrirDB().then(()=>obtenerActivosLocales()).then(setActivos).catch(e=>
    setMensaje(e instanceof Error?e.message:'No se pudo leer SQLite'));},[]);
  async function guardar() {
    if (!usuario || !permitido) {setMensaje('No tienes permiso para crear reportes.');return;}
    if (!seleccion || !titulo.trim() || !descripcion.trim()) {
      setMensaje('Debes elegir un activo, título y descripción.');return;
    }
    setGuardando(true);setMensaje('');
    try {
      const reporte=await crearReporteOffline({
        equipo_id:seleccion,usuario_id:usuario.id,
        titulo:titulo.trim(),descripcion:descripcion.trim(),prioridad,
        foto_uri:evidencia.fotoURI,
      });
      // Guardar en SQLite es suficiente: no se bloquea el formulario por falta de red.
      void sincronizarPendientes().catch(console.warn);
      setMensaje(`Reporte guardado en este teléfono (${reporte.id_local}). Se sincronizará al haber conexión.`);
      setTitulo('');setDescripcion('');
      router.replace('/reportes');
    } catch(e) {setMensaje(e instanceof Error?e.message:'No se pudo guardar el reporte');}
    finally {setGuardando(false);}
  }
  return <ScrollView style={s.pantalla} contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">
    <Text style={s.titulo}>Nuevo reporte de falla</Text>
    {!permitido ? <Text style={s.error}>No tienes permiso para registrar fallas.</Text> : <>
      <Text style={s.etiqueta}>Activo</Text>
      <View style={s.opciones}>{activos.map(a=><Pressable key={a.id} accessibilityRole="button"
        style={[s.opcion,seleccion===a.id&&s.seleccionado]} onPress={()=>setSeleccion(a.id)}>
        <Text style={seleccion===a.id?s.blanco:s.oscuro}>{a.codigo_interno} · {a.nombre}</Text>
      </Pressable>)}</View>
      {!activos.length && <Text style={s.error}>
        Sin activos locales. Conéctate, inicia sesión y sincroniza antes de escanear.
      </Text>}
      <Text style={s.etiqueta}>Título</Text>
      <TextInput style={s.input} value={titulo} onChangeText={setTitulo} maxLength={150}
        placeholder="Ej.: vibración en la bomba" />
      <Text style={s.etiqueta}>Descripción</Text>
      <TextInput style={[s.input,{height:120,textAlignVertical:'top'}]} multiline maxLength={3000}
        value={descripcion} onChangeText={setDescripcion} placeholder="¿Qué ocurrió y dónde?"/>
      <Text style={s.etiqueta}>Prioridad</Text>
      <View style={s.opciones}>{prioridades.map(p=><Pressable key={p} accessibilityRole="button"
        style={[s.opcion,prioridad===p&&s.seleccionado]} onPress={()=>setPrioridad(p)}>
        <Text style={prioridad===p?s.blanco:s.oscuro}>{p.toUpperCase()}</Text>
      </Pressable>)}</View>
      <PhotoEvidence {...evidencia}/>
      {mensaje && <Text style={s.error}>{mensaje}</Text>}
      <Pressable accessibilityRole="button" disabled={guardando||evidencia.ocupado}
        style={[s.guardar,(guardando||evidencia.ocupado)&&{opacity:0.5}]}
        onPress={()=>void guardar()}><Text style={s.blanco}>
          {guardando?'Guardando...':'Guardar reporte (también sin internet)'}
        </Text></Pressable>
    </>}
  </ScrollView>;
}
const s=StyleSheet.create({
  pantalla:{backgroundColor:'#F1F4F8',flex:1},contenido:{padding:16,gap:10},
  titulo:{fontSize:22,fontWeight:'800',color:'#142B45'},
  etiqueta:{fontSize:15,fontWeight:'700',color:'#142B45',marginTop:8},
  opciones:{flexDirection:'row',flexWrap:'wrap',gap:8},
  opcion:{minWidth:48,minHeight:48,padding:12,justifyContent:'center',
    borderRadius:10,borderWidth:1,borderColor:'#CBD5E1',backgroundColor:'#fff'},
  seleccionado:{backgroundColor:'#142B45'},
  blanco:{color:'#fff',fontWeight:'700',textAlign:'center'},
  oscuro:{color:'#142B45',fontWeight:'600'},
  input:{minHeight:50,backgroundColor:'#fff',borderRadius:10,borderWidth:1,
    borderColor:'#CBD5E1',padding:12,fontSize:15},
  guardar:{minHeight:54,backgroundColor:'#15803D',borderRadius:10,alignItems:'center',justifyContent:'center'},
  error:{color:'#B91C1C'},
});
