/* eslint-disable no-else-return */
import { Platform } from "react-native";
import {
  checkMultiple,
  PERMISSIONS,
  request,
  RESULTS,
} from "react-native-permissions";

export default async () => {
  if (Platform.OS === "android") {
    const androidPermissions = [
      PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
      PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    ];

    const checkResults = await checkMultiple(androidPermissions);

    let allPermissions: Array<string> = [];
    for (const key in checkResults) {
      let perm: string;
      if (checkResults[key] !== RESULTS.GRANTED) {
        perm = await request(key);
      } else {
        perm = checkResults[key];
      }
      allPermissions.push(perm);
    }
    if (
      allPermissions.every(
        (val) => val === RESULTS.GRANTED || val === RESULTS.UNAVAILABLE
      )
    ) {
      return Promise.resolve();
    } else if (allPermissions.every((p) => p === RESULTS.UNAVAILABLE)) {
      throw new Error(
        "Bluetooth or location service not available on this device. 
      );
    } else if (allPermissions.some((p) => p === RESULTS.BLOCKED)) {
      throw new Error(
        "Permissions blocked. Please reset location permissions in the app settings."
      );
    }

    console.log("something wrong with permissions");
    console.log(allPermissions);

    throw new Error("Unknown permissions error");
  } else if (Platform.OS === "ios") {
    const iosPermissions = [
      PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL,
      PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    ];

    const checkResults = await checkMultiple(iosPermissions);

    const allPermissions: Array<string> = [];

    for (const key in checkResults) {
      let perm: string;
      if (checkResults[key] !== RESULTS.GRANTED) {
        perm = await request(key);
      } else {
        perm = checkResults[key];
      }
      allPermissions.push(perm);
    }

    if (allPermissions.every((val) => val === RESULTS.GRANTED)) {
      console.log("all good with permissions");
      return Promise.resolve();
    } else {
      console.log("something wrong with permissions");
      console.log(allPermissions);
      throw new Error("Failed to get permissions");
    }
  }

  return Promise.reject(new Error("Unknown OS"));
};
