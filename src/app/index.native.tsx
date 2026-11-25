import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function InicioNative() {
  const router=useRouter();
  const {usuario,tieneRol,salir}=useAuth();
  const puedeReportar=tieneRol('OPERARIO','TECNICO','SUPERVISOR','ADMIN');
  const puedeOrden=tieneRol('TECNICO','SUPERVISOR','ADMIN');
  const supervisor=tieneRol('SUPERVISOR','ADMIN');
  function boton(texto:string,onPress:()=>void) {
    return <Pressable key={texto} style={s.card} accessibilityRole="button" onPress={onPress}>
      <Text style={s.cardText}>{texto} ›</Text>
    </Pressable>;
  }
  return <ScrollView style={s.pantalla} contentContainerStyle={s.contenido}>
    <View style={s.cabecera}>
      <Text style={s.titulo}>MANTENIMIENTO</Text>
      <Text style={s.subtitulo}>Hola, {usuario?.nombre || 'Usuario'}</Text>
      <Text style={s.subtitulo}>Rol(es): {usuario?.roles.join(', ') || 'Sin rol'}</Text>
    </View>
    {boton('Escanear QR de activo',()=>router.push('/escanear'))}
    {tieneRol('TECNICO','SUPERVISOR','ADMIN') && boton('Activos industriales',()=>router.push('/explore'))}
    {puedeReportar && boton('Reportar falla',()=>router.push('/reporte/nuevo'))}
    {puedeReportar && boton('Mis reportes offline',()=>router.push('/reportes'))}
    {puedeOrden && boton('Órdenes de trabajo',()=>router.push('/ordenes'))}
    {supervisor && boton('Indicadores de mantenimiento',()=>router.push('/metricas'))}
    {boton('Cerrar sesión',()=>void salir())}
  </ScrollView>;
}
const s=StyleSheet.create({
  pantalla:{flex:1,backgroundColor:'#F1F4F8'},contenido:{padding:16,gap:12},
  cabecera:{backgroundColor:'#142B45',padding:20,borderRadius:12,marginBottom:10},
  titulo:{fontWeight:'900',fontSize:23,color:'#fff'},
  subtitulo:{color:'#CBD5E1',marginTop:7,fontSize:14},
  card:{minHeight:58,minWidth:48,padding:16,justifyContent:'center',
    borderRadius:12,borderLeftWidth:5,borderLeftColor:'#F59E0B',backgroundColor:'#fff'},
  cardText:{fontSize:16,fontWeight:'700',color:'#142B45'},
});
