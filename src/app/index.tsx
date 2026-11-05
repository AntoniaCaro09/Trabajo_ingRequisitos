import { View, Text, StyleSheet, ScrollView, StatusBar } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.logo}>MANTENIMIENTO</Text>
        <Text style={styles.subtitle}>GESTIÓN INDUSTRIAL</Text>
        <Text style={styles.welcome}>Bienvenido</Text>
        <Text style={styles.description}>
          Control y gestión de mantenimiento de planta.
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Panel principal</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activos industriales</Text>
          <Text style={styles.cardDescription}>
            Consulta y administra los equipos de planta.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reportes de fallas</Text>
          <Text style={styles.cardDescription}>
            Registra anomalías y evidencias fotográficas.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Órdenes de trabajo</Text>
          <Text style={styles.cardDescription}>
            Gestiona las actividades de mantenimiento.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Indicadores</Text>
          <Text style={styles.cardDescription}>
            Consulta MTTR, MTBF y tiempos de detención.
          </Text>
        </View>

        <Text style={styles.footer}>
          APP MANTENIMIENTO PLANTA
        </Text>
        <Text style={styles.version}>Versión de desarrollo 0.1.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F4F8",
  },
  header: {
    backgroundColor: "#142B45",
    padding: 30,
    paddingTop: 65,
    paddingBottom: 40,
  },
  logo: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  subtitle: {
    color: "#F59E0B",
    fontSize: 12,
    marginTop: 5,
    letterSpacing: 2,
  },
  welcome: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 35,
  },
  description: {
    color: "#D5DFEA",
    fontSize: 15,
    marginTop: 8,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#142B45",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 12,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderLeftColor: "#F59E0B",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#142B45",
  },
  cardDescription: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
  },
  footer: {
    textAlign: "center",
    color: "#142B45",
    fontWeight: "bold",
    marginTop: 25,
  },
  version: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 5,
    marginBottom: 25,
  },
});