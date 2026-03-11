import { SchedulerData } from "../types/common";
import { SchedulerProps, setupSchedulerProps } from "../types/props";
import { saveSchedulerDB } from "./db-service";
import ParkingNativeService from "../native/ParkingModule";

export async function saveSchedulerAsync({
  database,
  data,
  onSuccess,
  onError,
}: SchedulerProps) {
  try {
    if (!data.locationId) throw new Error("locationId is required");
    if (!data.startTime) throw new Error("startTime is required");
    if (!data.durationMinutes) throw new Error("durationMinutes is required");
    if (!data.endTime) throw new Error("endTime is required");
    if (!data.notifyBeforeMinutes)
      throw new Error("notifyBeforeMinutes is required");

    if (data.endTime <= data.startTime) {
      throw new Error("endTime must be after startTime");
    }

    const now = Date.now();
    const params = [
      data.locationId,
      data.startTime,
      data.durationMinutes,
      data.endTime,
      data.notifyBeforeMinutes,
      now, // createdAt
      now, // updatedAt
    ];

    console.log("Saving scheduler with params:", params);

    const result = await saveSchedulerDB(database, params);

    console.log("Scheduler saved with ID:", result.lastInsertRowId);

    const scheduler = {
      id: result.lastInsertRowId,
      locationId: data.locationId,
      startTime: data.startTime,
      durationMinutes: data.durationMinutes,
      endTime: data.endTime,
      notifyBeforeMinutes: data.notifyBeforeMinutes,
      notificationSent: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    onSuccess?.(scheduler);
    return scheduler;
  } catch (error) {
    console.error("saveSchedulerAsync error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to save scheduler";
    onError?.(errorMessage);
  }
}

export const setupSchedulerAsync = async ({
  database,
  locationId,
  title,
  durationMinutes,
  notifyBeforeMinutes,
}: setupSchedulerProps): Promise<boolean> => {
  const now = Date.now();

  const schedulerData: SchedulerData = {
    locationId: locationId,
    startTime: now,
    durationMinutes: durationMinutes,
    endTime: now + durationMinutes * 60 * 1000,
    notifyBeforeMinutes: notifyBeforeMinutes,
  };

  return new Promise((resolve, reject) => {
    saveSchedulerAsync({
      database,
      data: schedulerData,
      onSuccess: async (savedData) => {
        console.log("✅ Scheduler saved:", savedData);
        try {
          const scheduled = await ParkingNativeService.scheduleReminder(
            savedData.locationId,
            title,
            savedData.durationMinutes,
            savedData.notifyBeforeMinutes,
          );
          resolve(scheduled);
        } catch (error) {
          console.error("Failed to schedule reminder:", error);
          reject(error);
        }
      },
      onError: (message) => {
        console.error("❌ Error:", message);
        reject(new Error(message));
      },
    });
  });
};
