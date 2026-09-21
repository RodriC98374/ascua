// Prueba temporal de la fase 00: valida que la librería de gráficas funcione en Android y web.
// Se elimina al empezar la fase 05.
import { Text, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';

const weekCompletion = [
  { value: 100, label: 'L' },
  { value: 67, label: 'M' },
  { value: 33, label: 'X' },
  { value: 100, label: 'J' },
  { value: 83, label: 'V' },
  { value: 50, label: 'S' },
  { value: 100, label: 'D' },
];

export function ChartsSpike() {
  return (
    <View className="w-full gap-4 rounded-2xl bg-white p-4">
      <Text className="text-base font-semibold text-violet-900">Cumplimiento semanal (%)</Text>
      <BarChart
        data={weekCompletion}
        maxValue={100}
        barWidth={22}
        spacing={14}
        frontColor="#7C3AED"
        isAnimated
      />
      <Text className="text-base font-semibold text-violet-900">Tendencia</Text>
      <LineChart
        data={weekCompletion}
        maxValue={100}
        spacing={40}
        color="#14B8A6"
        curved
        isAnimated
      />
    </View>
  );
}
