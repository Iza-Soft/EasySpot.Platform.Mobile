import { useState, useEffect, useRef } from "react";
import { deactivateSchedulerAsync } from "../services/scheduler-service";
import { TimerProps } from "../types/props";
import { useTranslation } from "react-i18next";

interface TimerState {
  remainingTime: number | null;
  isExpired: boolean;
  formattedTime: string;
  endTime: number | null;
  isWarning: boolean;
}

export const useTimer = ({ database, scheduler }: TimerProps) => {
  const { t: localize } = useTranslation();

  const [timerState, setTimerState] = useState<TimerState>({
    remainingTime: null,
    isExpired: false,
    formattedTime: "",
    endTime: null,
    isWarning: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasNotifiedExpireRef = useRef<boolean>(false);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const deactivateScheduler = async (schedulerId: number) => {
    await deactivateSchedulerAsync({
      database,
      id: schedulerId, // ID на scheduler-а
      onSuccess: () => {
        console.log("✅ Scheduler deactivated successfully:", schedulerId);
      },
      onError: (message) => {
        console.error("Failed to deactivate scheduler:", message);
      },
    });
  };

  useEffect(() => {
    hasNotifiedExpireRef.current = false;

    // Проверка дали има активен scheduler
    if (!scheduler || !scheduler.isActive) {
      setTimerState({
        remainingTime: null,
        isExpired: true,
        formattedTime: localize("timer.expired"),
        endTime: null,
        isWarning: false,
      });
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = scheduler.endTime - now;

      if (remaining <= 0) {
        setTimerState({
          remainingTime: 0,
          isExpired: true,
          formattedTime: localize("timer.expired"),
          endTime: scheduler.endTime,
          isWarning: false,
        });

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        if (!hasNotifiedExpireRef.current) {
          hasNotifiedExpireRef.current = true;
          deactivateScheduler(scheduler.id);
        }
        return;
      }

      const remainingSeconds = Math.floor(remaining / 1000);
      const remainingMinutes = Math.floor(remaining / (60 * 1000));
      const isWarning = remainingMinutes <= scheduler.notifyBeforeMinutes;

      setTimerState({
        remainingTime: remainingSeconds,
        isExpired: false,
        formattedTime: formatTime(remainingSeconds),
        endTime: scheduler.endTime,
        isWarning,
      });
    };

    // Инициализиране
    updateTimer();

    // Стартиране на интервал
    intervalRef.current = setInterval(updateTimer, 1000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [scheduler]);

  return timerState;
};
