import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { obtenerActivosLocales } from '@/database/sqlite';
import type { Activo } from '@/models/offline';
import { sincronizarPendientes } from '@/services/syncService';
export default function InventarioNative() {
  const {tieneRol}=useAuth();
  const permitido=tieneRol('TECNICO','SUPERVISOR','ADMIN');
  const [activos,setActivos]=useState<Activo[]>([]);
  const [error,setError]=useState('');
  const cargar=useCallback(async()=>{
    if (!permitido) return;
    try {setActivos(await obtenerActivosLocales());}catch(e){setError(String(e));}
  },[permitido]);
  useFocusEffect(useCallback(()=>{void cargar();},[cargar]));
  async function actualizar() {
    const resultado=await sincronizarPendientes();
    if(resultado.error)setError(resultado.error);
    await cargar();
  }
  return <ScrollView style={s.pantalla} contentContainerStyle={s.contenido}>
    <Text style={s.titulo}>Inventario local</Text>
    {!permitido?<Text>Este módulo está reservado a técnicos y supervisión.</Text>:<>
      <Pressable style={s.boton} accessibilityRole="button" onPress={()=>void actualizar()}>
        <Text style={s.texto}>Actualizar inventario</Text>
      </Pressable>
      {error?<Text style={{color:'#B91C1C'}}>{error}</Text>:null}
      {activos.map(a=><View key={a.id} style={s.card}>
        <Text style={{fontWeight:'700'}}>{a.codigo_interno}: {a.nombre}</Text>
        <Text>Área: {a.area} · Estado: {a.estado}</Text>
      </View>)}
    </>}
  </ScrollView>;
}
const s=StyleSheet.create({
  pantalla:{flex:1,backgroundColor:'#F1F4F8'},contenido:{padding:16,gap:12},
  titulo:{fontSize:22,fontWeight:'800',color:'#142B45'},
  boton:{minWidth:48,minHeight:48,backgroundColor:'#F59E0B',padding:12,
    borderRadius:10,alignItems:'center',justifyContent:'center'},
  texto:{fontWeight:'800',color:'#142B45'},
  card:{backgroundColor:'#fff',padding:16,borderRadius:10,gap:8},
});
