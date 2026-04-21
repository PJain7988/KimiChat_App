import React from 'react';
import { StyleSheet, SafeAreaView, ActivityIndicator, View, Platform, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const webViewRef = React.useRef(null);

  // Handle back button on Android
  React.useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#00c9b1" />
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://kimichat-app.onrender.com' }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#00c9b1" />
          </View>
        )}
        allowsBackForwardNavigationGestures={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00c9b1',
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  webview: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
