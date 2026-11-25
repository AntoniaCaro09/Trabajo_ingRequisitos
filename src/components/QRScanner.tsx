import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { buscarActivoPorQR } from '@/database/sqlite';

export default function QRScanner(): React.JSX.Element {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [linterna,setLinterna] = useState(false);
  const [mensaje,setMensaje] = useState('Apunta al código QR del equipo.');
  const [leyendo,setLeyendo] = useState(false);
  const bloqueo = useRef(false);

  const escanear = useCallback(async ({ data }: BarcodeScanningResult) => {
    if (bloqueo.current) return;
    bloqueo.current = true;
    setLeyendo(true);
    try {
      const activo = await buscarActivoPorQR(data);
      if (!activo) {
        setMensaje('QR no encontrado en este teléfono. Conéctate y sincroniza los activos.');
        // Evita lecturas repetidas del mismo QR hasta que la persona reintente.
        return;
      }
      router.replace({pathname:'/reporte/nuevo',params:{equipoId:activo.id}});
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'Error leyendo el QR.');
    } finally { setLeyendo(false); }
  },[]);

  if (!permiso) return <ActivityIndicator style={{flex:1}} />;
  if (!permiso.granted) return <View style={s.contenedor}>
    <Text style={s.texto}>Para escanear equipos necesitamos acceso a la cámara.</Text>
    <Pressable accessibilityRole="button" style={s.boton} onPress={() => void pedirPermiso()}>
      <Text style={s.botonTexto}>Permitir cámara</Text>
    </Pressable>
    {!permiso.canAskAgain && <Text style={s.texto}>Habilita la cámara en Ajustes del teléfono.</Text>}
  </View>;
  return <View style={s.contenedor}>
    <Text style={s.texto}>{mensaje}</Text>
    <CameraView style={s.camara} facing="back" enableTorch={linterna}
      barcodeScannerSettings={{barcodeTypes:['qr']}}
      onBarcodeScanned={bloqueo.current ? undefined : (evento)=>void escanear(evento)} />
    <View style={s.acciones}>
      <Pressable accessibilityRole="button" accessibilityLabel={linterna?'Apagar linterna':'Encender linterna'}
        style={s.boton} onPress={()=>setLinterna(v=>!v)}>
        <Text style={s.botonTexto}>{linterna?'🔦 Apagar linterna':'🔦 Encender linterna'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={s.boton}
        onPress={()=>{bloqueo.current=false;setMensaje('Vuelve a apuntar al QR del equipo.');}}>
        <Text style={s.botonTexto}>Volver a escanear</Text>
      </Pressable>
    </View>
    {leyendo && <ActivityIndicator />}
  </View>;
}
const s = StyleSheet.create({
  contenedor:{flex:1,backgroundColor:'#142B45',padding:16,justifyContent:'center',gap:14},
  texto:{color:'#fff',fontSize:16,textAlign:'center'},
  camara:{height:420,width:'100%',borderRadius:12,overflow:'hidden'},
  acciones:{flexDirection:'row',gap:12,flexWrap:'wrap',justifyContent:'center'},
  boton:{minHeight:48,minWidth:48,paddingHorizontal:18,paddingVertical:12,
    backgroundColor:'#F59E0B',borderRadius:10,justifyContent:'center',alignItems:'center'},
  botonTexto:{fontWeight:'700',color:'#142B45',fontSize:15},
});
