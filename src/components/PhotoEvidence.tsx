import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

const MAX_BYTES = 500_000; // Menor a 500 KB decimales, no igual.

export async function comprimirYGuardarFoto(uriOrigen: string): Promise<string> {
  const intentos = [
    {ancho:1600,calidad:0.75},{ancho:1280,calidad:0.6},
    {ancho:1024,calidad:0.45},{ancho:800,calidad:0.3},
    {ancho:640,calidad:0.22},{ancho:480,calidad:0.12},
    {ancho:320,calidad:0.08},
  ];
  const carpeta = `${FileSystem.documentDirectory}evidencias/`;
  if (!FileSystem.documentDirectory) throw new Error('Almacenamiento no disponible.');
  await FileSystem.makeDirectoryAsync(carpeta,{intermediates:true});
  for (const intento of intentos) {
    const archivo = await ImageManipulator.manipulateAsync(
      uriOrigen,[{resize:{width:intento.ancho}}],
      {compress:intento.calidad,format:ImageManipulator.SaveFormat.JPEG},
    );
    const info = await FileSystem.getInfoAsync(archivo.uri);
    if (info.exists && 'size' in info && typeof info.size === 'number' &&
        info.size > 0 && info.size < MAX_BYTES) {
      const destino = `${carpeta}${Crypto.randomUUID()}.jpg`;
      await FileSystem.copyAsync({from:archivo.uri,to:destino});
      const persistente = await FileSystem.getInfoAsync(destino);
      if (!persistente.exists || !('size' in persistente) ||
          !persistente.size || persistente.size >= MAX_BYTES) {
        await FileSystem.deleteAsync(destino,{idempotent:true});
        throw new Error('La fotografía guardada no cumple el límite de 500 KB.');
      }
      return destino;
    }
  }
  throw new Error('No fue posible reducir esta fotografía por debajo de 500 KB.');
}

export function usePhotoEvidence() {
  const [fotoURI,setFotoURI] = useState<string|null>(null);
  const [ocupado,setOcupado] = useState(false);
  const [error,setError] = useState<string|null>(null);
  const procesar = useCallback(async (origen:'camara'|'galeria') => {
    setOcupado(true);setError(null);
    try {
      const permiso = origen === 'camara'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) throw new Error('Debes conceder el permiso correspondiente.');
      const resultado = origen === 'camara'
        ? await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:1})
        : await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:1});
      if (resultado.canceled || resultado.assets.length === 0) return;
      const nueva = await comprimirYGuardarFoto(resultado.assets[0].uri);
      setFotoURI(nueva);
    } catch(e) {setError(e instanceof Error ? e.message : 'No se pudo procesar la fotografía.');}
    finally {setOcupado(false);}
  },[]);
  return {fotoURI,ocupado,error,tomar:()=>procesar('camara'),
    elegir:()=>procesar('galeria'),limpiar:()=>setFotoURI(null)};
}

export function PhotoEvidence({fotoURI,ocupado,error,tomar,elegir,limpiar}:ReturnType<typeof usePhotoEvidence>) {
  return <View style={s.contenedor}>
    <Text style={s.titulo}>Evidencia fotográfica (máximo 500 KB)</Text>
    <View style={s.acciones}>
      <Pressable accessibilityRole="button" disabled={ocupado} style={s.boton}
        onPress={()=>void tomar()}><Text style={s.texto}>📷 Tomar foto</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={ocupado} style={s.boton}
        onPress={()=>void elegir()}><Text style={s.texto}>🖼 Elegir imagen</Text></Pressable>
    </View>
    {ocupado && <ActivityIndicator />}
    {error && <Text style={s.error}>{error}</Text>}
    {fotoURI && <View style={{gap:8}}>
      <Image source={{uri:fotoURI}} style={s.imagen} resizeMode="contain" />
      <Pressable accessibilityRole="button" style={s.boton} onPress={limpiar}>
        <Text style={s.texto}>Quitar fotografía del reporte</Text>
      </Pressable>
    </View>}
  </View>;
}
const s=StyleSheet.create({
  contenedor:{paddingVertical:12,gap:10},titulo:{fontSize:16,fontWeight:'700',color:'#142B45'},
  acciones:{flexDirection:'row',flexWrap:'wrap',gap:10},
  boton:{minWidth:48,minHeight:48,padding:12,borderRadius:10,alignItems:'center',
    justifyContent:'center',backgroundColor:'#F59E0B'},
  texto:{fontWeight:'700',color:'#142B45'},
  error:{color:'#B91C1C'},imagen:{height:220,width:'100%',borderRadius:10},
});
