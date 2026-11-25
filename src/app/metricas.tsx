import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { obtenerMetricas } from '@/services/mobileApi';
type Metricas={abiertas:number;completadas:number;mttr_horas:number|null};
export default function MetricasScreen() {
  const {tieneRol}=useAuth();
  const autorizado=tieneRol('SUPERVISOR','ADMIN');
  const [datos,setDatos]=useState<Metricas|null>(null);
  const [error,setError]=useState('');
  useFocusEffect(useCallback(()=>{
    if(!autorizado)return;
    void obtenerMetricas().then(setDatos).catch(e=>setError(e instanceof Error?e.message:'Error'));
  },[autorizado]));
  return <ScrollView style={s.pantalla} contentContainerStyle={s.contenido}>
    <Text style={s.titulo}>Indicadores de mantenimiento</Text>
    {!autorizado?<Text style={s.error}>Sin permiso para ver indicadores.</Text>
      :error?<Text style={s.error}>{error}</Text>
      :!datos?<ActivityIndicator/>:<View style={s.card}>
        <Text>Órdenes abiertas: {datos.abiertas}</Text>
        <Text>Órdenes completadas: {datos.completadas}</Text>
        <Text>MTTR estimado (horas entre inicio y fin): {datos.mttr_horas?.toFixed(2)??'Sin datos'}</Text>
        <Text>MTBF pendiente: requiere registrar horas efectivas de operación.</Text>
      </View>}
  </ScrollView>;
}
const s=StyleSheet.create({
  pantalla:{flex:1,backgroundColor:'#F1F4F8'},contenido:{padding:16,gap:12},
  titulo:{fontSize:22,fontWeight:'800',color:'#142B45'},
  card:{backgroundColor:'#fff',padding:20,borderRadius:12,gap:12},
  error:{color:'#B91C1C'},
});
