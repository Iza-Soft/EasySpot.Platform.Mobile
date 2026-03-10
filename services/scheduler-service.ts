import { SchedulerProps } from "../types/props";
import { saveSchedulerDB } from "./db-service";

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
