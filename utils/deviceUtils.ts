import * as Device from "expo-device";

export const checkBatteryOptimizations = async () => {
  // Взимаме информация за устройството от expo-device
  const manufacturer = Device.manufacturer || "";
  const brand = Device.brand || "";
  const modelName = Device.modelName || "";
  const designName = Device.designName || "";
  const productName = Device.productName || "";

  // Проверяваме за различните производители
  const manufacturerLower = manufacturer.toLowerCase();
  const brandLower = brand.toLowerCase();
  const modelLower = modelName.toLowerCase();
  const designLower = designName.toLowerCase();

  const isHuawei =
    manufacturerLower.includes("huawei") ||
    brandLower.includes("huawei") ||
    modelLower.includes("huawei") ||
    designLower.includes("huawei");

  const isXiaomi =
    manufacturerLower.includes("xiaomi") ||
    brandLower.includes("xiaomi") ||
    modelLower.includes("xiaomi") ||
    designLower.includes("xiaomi");

  const isOnePlus =
    manufacturerLower.includes("oneplus") ||
    brandLower.includes("oneplus") ||
    modelLower.includes("oneplus");

  // За Samsung и други производители, които също имат ограничения
  const isSamsung =
    manufacturerLower.includes("samsung") || brandLower.includes("samsung");

  return {
    needsOptimization: isHuawei || isXiaomi || isOnePlus || isSamsung,
    manufacturer: manufacturer || brand || "Unknown",
    brand: brand || "Unknown",
    model: modelName,
    deviceType: Device.deviceType,
    osVersion: Device.osVersion,
  };
};
