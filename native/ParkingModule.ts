// src/native/ParkingModule.ts
import { NativeModules, Platform } from "react-native";

const { ParkingModule } = NativeModules;

export interface ParkingReminder {
  locationId: number;
  title: string;
  endTime: number;
  remindBeforeMinutes: number;
}

class ParkingNativeService {
  // Инициализация
  async initialize(): Promise<boolean> {
    if (Platform.OS !== "android") {
      console.log("⚠️ Native module only available on Android");
      return false;
    }

    try {
      await ParkingModule.initialize();
      console.log("✅ Native module initialized");
      return true;
    } catch (error) {
      console.error("❌ Native module init failed:", error);
      return false;
    }
  }

  // Планиране на напомняне
  async scheduleReminder(
    locationId: number,
    title: string,
    durationMinutes: number = 60,
    remindBeforeMinutes: number = 10,
  ): Promise<boolean> {
    if (Platform.OS !== "android") {
      console.log("⚠️ Scheduling only available on Android");
      return false;
    }

    try {
      const endTime = Date.now() + durationMinutes * 60 * 1000;

      await ParkingModule.scheduleReminder(
        locationId,
        title,
        endTime,
        remindBeforeMinutes,
      );

      console.log(`✅ Native reminder scheduled for location ${locationId}`);
      return true;
    } catch (error) {
      console.error("❌ Failed to schedule reminder:", error);
      return false;
    }
  }

  /** Test reminder in N seconds — same alarm + receiver as a real one. */
  async scheduleTestReminder(seconds: number): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    try {
      await ParkingModule.scheduleTestReminder(seconds);
      return true;
    } catch (error) {
      console.error("❌ Failed to schedule test reminder:", error);
      return false;
    }
  }

  /** Delivered reminders, newest first (JSON from ParkingAlarms.kt). */
  async getReminderLog(): Promise<string> {
    if (Platform.OS !== "android") return "[]";
    try {
      return await ParkingModule.getReminderLog();
    } catch {
      return "[]";
    }
  }

  async clearReminderLog(): Promise<void> {
    if (Platform.OS !== "android") return;
    await ParkingModule.clearReminderLog().catch(() => undefined);
  }

  // Отказване на напомняне
  async cancelReminder(locationId: number): Promise<boolean> {
    if (Platform.OS !== "android") {
      return false;
    }

    try {
      await ParkingModule.cancelReminder(locationId);
      console.log(`✅ Reminder cancelled for location ${locationId}`);
      return true;
    } catch (error) {
      console.error("❌ Failed to cancel reminder:", error);
      return false;
    }
  }

  // Проверка за активно напомняне
  async hasActiveReminder(locationId: number): Promise<boolean> {
    if (Platform.OS !== "android") {
      return false;
    }

    try {
      const hasReminder = await ParkingModule.hasActiveReminder(locationId);
      return hasReminder;
    } catch (error) {
      console.error("❌ Failed to check reminder:", error);
      return false;
    }
  }
}

export default new ParkingNativeService();
