import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import AppCamera from './src/components/CameraView';

export default function App() {
  return (
    <View style={styles.container}>
      <AppCamera />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
