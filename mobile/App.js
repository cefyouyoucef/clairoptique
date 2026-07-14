import React, { useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: "http://192.168.1.5:5173" }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  webview: {
    flex: 1
  },
  loader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  }
});
