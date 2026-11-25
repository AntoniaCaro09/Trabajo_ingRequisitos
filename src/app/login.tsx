import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
export default function LoginScreen() {
  const {ingresar} = useAuth();
  const [correo,setCorreo] = useState('');
  const [clave,setClave] = useState('');
  const [error,setError] = useState('');
  const [ocupado,setOcupado] = useState(false);
  async function entrar() {
    setOcupado(true);setError('');
    try {await ingresar(correo,clave);} catch(e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {setOcupado(false);}
  }
  return <View style={s.pantalla}>
    <Text style={s.titulo}>Acceso a mantenimiento de planta</Text>
    {Platform.OS === 'web' && <Text style={s.error}>
      Este módulo usa SecureStore y SQLite nativos. Pruébalo en Android o iOS.
    </Text>}
    <TextInput style={s.input} accessibilityLabel="Correo electrónico" placeholder="correo@empresa.cl"
      autoCapitalize="none" keyboardType="email-address" autoComplete="email"
      value={correo} onChangeText={setCorreo}/>
    <TextInput style={s.input} accessibilityLabel="Contraseña" placeholder="Contraseña"
      secureTextEntry value={clave} onChangeText={setClave}/>
    {error ? <Text style={s.error}>{error}</Text> : null}
    <Pressable style={[s.boton,ocupado&&{opacity:0.6}]} accessibilityRole="button"
      disabled={ocupado || Platform.OS === 'web'} onPress={()=>void entrar()}>
      {ocupado?<ActivityIndicator color="#fff"/>:<Text style={s.botonTexto}>Ingresar</Text>}
    </Pressable>
  </View>;
}
const s=StyleSheet.create({
  pantalla:{flex:1,backgroundColor:'#F1F4F8',padding:24,justifyContent:'center',gap:16},
  titulo:{color:'#142B45',fontWeight:'800',fontSize:24},
  input:{minHeight:52,borderColor:'#CBD5E1',borderWidth:1,borderRadius:10,
    paddingHorizontal:14,backgroundColor:'#fff',fontSize:16},
  boton:{minHeight:52,minWidth:48,backgroundColor:'#142B45',borderRadius:10,
    alignItems:'center',justifyContent:'center'},
  botonTexto:{color:'#fff',fontWeight:'800',fontSize:16},
  error:{color:'#B91C1C'},
});
