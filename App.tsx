import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const useInitTensorFlow = (): boolean => {
  const [isTfReady, setIsTfReady] = useState(false);

  const initializeTf = async () => {
    await tf.ready();
    setIsTfReady(true);
  };

  useEffect(() => {
    initializeTf();
  }, []);

  return isTfReady;
};


export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
