import { Stack } from 'expo-router';

/** Pila de la pestaña Hoy: los formularios de hábitos se abren aquí, con la navegación visible. */
export default function TodayStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
