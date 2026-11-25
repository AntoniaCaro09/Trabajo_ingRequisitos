import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import type { EstadoOrden, OrdenMovil } from '@/models/offline';
import { cambiarOrdenMovil, obtenerOrdenesMoviles } from '@/services/mobileApi';

const transiciones:Record<EstadoOrden,EstadoOrden[]>={
  pendiente:['en_progreso','cancelada'],
  asignada:['en_progreso','cancelada'],
  en_progreso:['pausada','completada'],
  pausada:['en_progreso','cancelada'],
  completada:[],cancelada:[],
};
const etiquetas:Record<EstadoOrden,string>={
  pendiente:'Pendiente',asignada:'Asignada',en_progreso:'Iniciar / Reanudar',
  pausada:'Pausar',completada:'Completar',cancelada:'Cancelar',
};
export default function OrdenesNativas() {
  const {tieneRol}=useAuth();
  const [ordenes,setOrdenes]=useState<OrdenMovil[]>([]);
  const [cargando,setCargando]=useState(false);
  const [operando,setOperando]=useState<string|null>(null);
  const [error,setError]=useState('');
  const autorizado=tieneRol('TECNICO','SUPERVISOR','ADMIN');
  const cargar=useCallback(async()=>{
    if (!autorizado) return;
    setCargando(true);
    try {setOrdenes(await obtenerOrdenesMoviles());setError('');}
    catch(e){setError(e instanceof Error?e.message:'No fue posible consultar las órdenes');}
    finally{setCargando(false);}
  },[autorizado]);
  useFocusEffect(useCallback(()=>{void cargar();},[cargar]));
  async function cambiar(id:string,estado:EstadoOrden) {
    setOperando(id);setError('');
    try {
      const actualizada=await cambiarOrdenMovil(id,estado);
      setOrdenes(prev=>prev.map(o=>o.id===id?{...o,...actualizada}:o));
    } catch(e){setError(e instanceof Error?e.message:'No se pudo actualizar la OT');}
    finally{setOperando(null);}
  }
  function confirmar(id:string,estado:EstadoOrden) {
    Alert.alert('Confirmar cambio',`¿Cambiar OT #${id} a ${estado}?`,[
      {text:'Cancelar',style:'cancel'},
      {text:'Confirmar',onPress:()=>void cambiar(id,estado)},
    ]);
  }
  return <ScrollView style={s.pantalla} contentContainerStyle={s.contenido}>
    <Text style={s.titulo}>Órdenes de trabajo</Text>
    {!autorizado ? <Text style={s.error}>Tu rol no permite gestionar órdenes.</Text> : <>
      <Pressable style={s.boton} accessibilityRole="button" onPress={()=>void cargar()}>
        <Text style={s.botonTexto}>Actualizar órdenes</Text>
      </Pressable>
      {cargando&&<ActivityIndicator />}
      {error&&<Text style={s.error}>{error}</Text>}
      {ordenes.map(o=><View style={s.card} key={o.id}>
        <Text style={s.negrita}>OT #{o.id}: {o.titulo}</Text>
        <Text>Equipo #{o.equipo_id} · Prioridad: {o.prioridad}</Text>
        <Text>Estado: {o.estado}</Text>
        {o.estado==='completada'?<View style={s.verde}>
          <Text style={s.verdeTexto}>✓ Todo listo</Text>
        </View>:<View style={s.acciones}>
          {transiciones[o.estado].map(estado=><Pressable key={estado}
            accessibilityRole="button" accessibilityLabel={`${etiquetas[estado]} orden ${o.id}`}
            disabled={operando===o.id} style={[s.boton,operando===o.id&&{opacity:0.5}]}
            onPress={()=>confirmar(o.id,estado)}>
            <Text style={s.botonTexto}>{etiquetas[estado]}</Text>
          </Pressable>)}
        </View>}
      </View>)}
    </>}
  </ScrollView>;
}
const s=StyleSheet.create({
  pantalla:{flex:1,backgroundColor:'#F1F4F8'},contenido:{padding:16,gap:12},
  titulo:{fontSize:22,fontWeight:'800',color:'#142B45'},
  card:{padding:16,backgroundColor:'#fff',borderRadius:12,gap:10},
  negrita:{fontWeight:'800',color:'#142B45',fontSize:16},
  acciones:{flexDirection:'row',flexWrap:'wrap',gap:10},
  boton:{minWidth:48,minHeight:48,paddingHorizontal:18,paddingVertical:12,
    borderRadius:10,justifyContent:'center',alignItems:'center',backgroundColor:'#F59E0B'},
  botonTexto:{fontWeight:'700',color:'#142B45'},error:{color:'#B91C1C'},
  verde:{minHeight:48,minWidth:48,justifyContent:'center',alignItems:'center',
    backgroundColor:'#22C55E',padding:12,borderRadius:10},
  verdeTexto:{color:'#fff',fontWeight:'800',fontSize:17},
});
