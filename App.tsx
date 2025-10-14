import { SQLiteProvider } from "expo-sqlite";
import {
  createDBifNeeded,
  DB_NAME,
  openPersistentDB,
} from "./services/db-service";
import NavigatorComponent from "./components/Navigator";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function App() {
  const [db, setDb] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const database = await openPersistentDB();
      setDb(database);
    })();
  }, []);

  if (!db) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SQLiteProvider databaseName={DB_NAME} onInit={createDBifNeeded}>
      <NavigatorComponent />
    </SQLiteProvider>
  );
}
