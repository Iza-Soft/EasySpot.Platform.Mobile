import { SQLiteProvider } from "expo-sqlite";
import { createDBifNeeded, DB_NAME } from "./services/db-service";
import NavigatorComponent from "./components/Navigator";

export default function App() {
  return (
    <SQLiteProvider databaseName={DB_NAME} onInit={createDBifNeeded}>
      <NavigatorComponent />
    </SQLiteProvider>
  );
}
