
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import {
  AuthProvider,
  useAuth,
} from '@/context/AuthContext';

function NavegacionProtegida() {
  const { usuario, cargando } = useAuth();
  const segmentos = useSegments();
  const router = useRouter();

  const enLogin = segmentos[0] === 'login';

  useEffect(() => {
    void SplashScreen.hideAsync().catch((error) => {
      console.warn('Error al ocultar Splash Screen:', error);
    });
  }, []);

  useEffect(() => {
    if (cargando) return;

    if (!usuario && !enLogin) {
      router.replace('/login');
    } else if (usuario && enLogin) {
      router.replace('/');
    }
  }, [usuario, cargando, enLogin, router]);

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#142B45' },
          headerTintColor: '#FFFFFF',
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'Mantenimiento de planta' }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: 'Iniciar sesión',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="explore"
          options={{ title: 'Activos' }}
        />
        <Stack.Screen
          name="escanear"
          options={{ title: 'Escanear QR' }}
        />
        <Stack.Screen
          name="reporte/nuevo"
          options={{ title: 'Reportar falla' }}
        />
        <Stack.Screen
          name="reportes"
          options={{ title: 'Reportes' }}
        />
        <Stack.Screen
          name="ordenes"
          options={{ title: 'Órdenes' }}
        />
        <Stack.Screen
          name="metricas"
          options={{ title: 'Métricas' }}
        />
      </Stack>

      {cargando && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: '#FFFFFFEE',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator
            size="large"
            color="#142B45"
          />
        </View>
      )}
    </>
  );
}

export default function RootLayoutNative() {
  return (
    <AuthProvider>
      <NavegacionProtegida />
    </AuthProvider>
  );
}
