import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import BleManager, { Peripheral } from "react-native-ble-manager";
import { useMMKVStorage } from "react-native-mmkv-storage";
import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
} from "react-native";
import { stringToBytes } from "convert-string";
import Toast from "react-native-root-toast";
import storageKeys from "../util/storageKeys";
import { storage } from "../util/storage";
import checkBluetoothPermissions from "./checkBluetoothPermissions";
import DEVICE from "./DEVICE";

const serviceId = "some service id";

interface BleContextProps {
  isInitialized: boolean;
  conStatus: string;
  characteristicStatus: string;
  piCharacteristic: string | null;
  btPermissionError: string | null;
  setBTPermissionError: (a: string | null) => void;
  isScanning: boolean;
  connectToDevice: () => void;
  setIsUsingBluetooth: (a: boolean) => void;
  startScan: () => void;
  btIsActive: boolean;
  rebootDevice: (mac: string) => Promise<boolean>;
  sendDataToDevice: (data: any, onWriteSuccess: () => void) => Promise<boolean>;
}

const BleContext = React.createContext<BleContextProps>({
  isInitialized: false,
  conStatus: "init",
  characteristicStatus: "init",
  piCharacteristic: null,
  btPermissionError: null,
  setBTPermissionError: () => null,
  isScanning: false,
  connectToDevice: () => null,
  setIsUsingBluetooth: () => null,
  startScan: () => null,
  btIsActive: false,
  rebootDevice: async () => true,
  sendDataToDevice: async () => true,
});

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export const BleProvider: React.FC = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(false);
  const [isUsingBluetooth, setIsUsingBluetooth] = useState<boolean>(false);

  const [conStatus, setConStatus] = useState<
    "init" | "success" | "error" | "loading"
  >("init");

  const [characteristicStatus, setCharacteristicStatus] = useState<
    "init" | "success" | "error" | "loading"
  >("init");
  const [isScanning, setIsScanning] = useState(false);
  const [piCharacteristic, setCharacteristic] = useState<null | string>(null);
  const [devices, setDevices] = useMMKVStorage<Peripheral[]>(
    storageKeys.DEVICES,
    storage,
    []
  );

  const [btPermissionError, setBTPermissionError] = useState<string | null>(
    null
  );

  const [btIsActive, setBtIsActive] = useState(false);

  const update = useRef<EmitterSubscription>();
  const discover = useRef<EmitterSubscription>();
  const stop = useRef<EmitterSubscription>();

  const permissionsCheck = async () => {
    checkBluetoothPermissions()
      .then(() => {
        setPermissionsGranted(true);
        setIsUsingBluetooth(true);
        return Promise.resolve(true);
      })
      .catch((e) => {
        console.log("Error during permissions check");
        console.log(e);
        setBTPermissionError("Error with Bluetooth permissions");
      });
  };

  /**
   * Don't start manager until explicitly told to
   * Makes sure BleManager is only initialized once
   * Why? Starting the manager will prompt for BT permissions, so we can't just start it on app start
   * Important: Must be initialized before using any BT commands!
   */
  useEffect(() => {
    if (!isUsingBluetooth) return undefined;
    if (isInitialized) return undefined;

    // console.log("starting bt");

    BleManager.start({ showAlert: false }).then(() => {
      setIsInitialized(true);
    });
    return () => undefined;
  }, [isUsingBluetooth, isInitialized]);

  /**
   * Disconnect from device when app unmounts
   */
  useEffect(() => {
    return () => {
      const mac = devices[0]?.id;
      if (mac) BleManager.disconnect(mac);
    };
  }, [devices]);

  // Listeners
  // ----------------------------------------------------------------------------------------------

  /**
   * Listener for BT state (on/off)
   */
  useEffect(() => {
    if (!isInitialized) return undefined;

    const upd = bleManagerEmitter.addListener(
      "BleManagerDidUpdateState",
      (args) => {
        // console.log("did update bt");
        // console.log({ args });
        setBtIsActive(args.state === "on");
      }
    );

    BleManager.checkState();

    return () => {
      upd.remove();
    };
  }, [isInitialized]);

  /**
   * Listener for BT characteristics
   */
  useEffect(() => {
    if (!isInitialized) return undefined;

    if (!permissionsGranted) {
      update.current?.remove();
      return undefined;
    }

    const handleUpdatePeripheral = ({
      value,
      characteristic,
    }: {
      value: number[];
      characteristic: string;
    }) => {
      const val = String.fromCharCode(...value);
      console.log(`Received ${val} for characteristic ${characteristic}`);
    };

    permissionsCheck().then(() => {
      update.current = bleManagerEmitter.addListener(
        "BleManagerDidUpdateValueForCharacteristic",
        handleUpdatePeripheral
      );
    });

    return () => {
      update.current?.remove();
    };
  }, [isInitialized, permissionsGranted]);

  /**
   * Listener for BT device discovery
   */
  useEffect(() => {
    if (!isInitialized) return undefined;

    if (!permissionsGranted) {
      update.current?.remove();
      return undefined;
    }

    // This approach assumes you already know the name of the device you want to connect to
    const handleDiscoverPeripheral = (peripheral: Peripheral) => {
      if (!peripheral.name) return;
      if (peripheral.name !== "some_device") return;

      console.log("Got ble peripheral", peripheral.id);

      BleManager.stopScan();
    };

    permissionsCheck().then(() => {
      discover.current = bleManagerEmitter.addListener(
        "BleManagerDiscoverPeripheral",
        handleDiscoverPeripheral
      );
    });

    return () => {
      discover.current?.remove();
    };
  }, [isInitialized, permissionsGranted, setDevices]);

  /**
   * Listener for stopping scanning
   */
  useEffect(() => {
    if (!isInitialized) return undefined;

    if (!permissionsGranted) {
      stop.current?.remove();
      return undefined;
    }

    const handleStopScan = () => {
      console.log("Handling stop scan");
    };

    stop.current = bleManagerEmitter.addListener(
      "BleManagerStopScan",
      handleStopScan
    );

    return () => {
      stop.current?.remove();
    };
  }, [isInitialized, permissionsGranted]);

  // ----------------------------------------------------------------------------------------------

  // Device commands
  // ----------------------------------------------------------------------------------------------

  // Scan for local Ble devices and save the mac address to local storage
  const startScan = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await permissionsCheck();
    } catch (e) {
      console.log(e);
      setBTPermissionError("Error with Bluetooth permissions");
      return;
    }

    setConStatus("loading");
    setIsScanning(true);

    try {
      // why twice? I don't know, when I was debugging the only way
      // we could get it to find/connect to the Pi was calling this function twice
      // classify this code as "working, do not modify"
      // I'm mystified as to why this is necessary, and would love to explain why I need to do this to connect to my RPi
      await BleManager.scan([], 3, true);
      await BleManager.scan([], 5, true);
    } catch (err) {
      console.error(err);
      setConStatus("error");
      setIsScanning(false);
    }
  }, [isInitialized]);

  // Connect to device and get Characteristic
  const connectToDevice = useCallback(async () => {
    await permissionsCheck();

    const mac = devices[0]?.id;
    if (devices.length === 0 || !mac) {
      startScan();
      return;
    }

    setCharacteristicStatus("loading");
    setConStatus("loading");

    const isConnected = await BleManager.isPeripheralConnected(mac, [
      serviceId,
    ]);

    // console.log({ isConnected });

    if (!isConnected) {
      try {
        // connect function waits indefinitely, so only wait a max of 15 seconds before
        // assuming it's just not going to work
        const timeout = new Promise((_, reject) =>
          setTimeout(reject, 15 * 1000)
        );

        const connect = BleManager.connect(mac);

        await Promise.race([timeout, connect]);
      } catch (e) {
        console.log(e);
        Toast.show("Unable to find device");
        setConStatus("error");
        setCharacteristicStatus("error");
        return;
      }
    }

    setConStatus("success");

    let services;
    try {
      services = await BleManager.retrieveServices(mac);
      console.log("The services:");
      console.log({ services });
    } catch (e) {
      console.log("Unable to retrieve services:");
      console.log(e);
      Toast.show("Unable to get device information");
      setCharacteristicStatus("error");
      return;
    }

    const isConnected2 = await BleManager.isPeripheralConnected(mac, [
      serviceId,
    ]);

    console.log({ isConnected2, services });

    await BleManager.startNotification(
      mac,
      serviceId,
      DEVICE.characteristics.wifiCharacteristic.uuid
    );

    await BleManager.startNotification(
      mac,
      serviceId,
      DEVICE.characteristics.customCommandNotify.uuid
    );
  }, [devices, startScan]);

  const sendDataToDevice = useCallback(
    async (data: number, onWriteSuccess: () => void) => {
      if (!isInitialized) return Promise.reject(new Error("BT init error"));

      try {
        await permissionsCheck();
      } catch (e) {
        console.log(e);
        setBTPermissionError("Error with Bluetooth permissions");
        return Promise.reject(new Error("BT permission error"));
      }

      const mac = devices[0]?.id;

      if (devices.length === 0 || !mac) {
        const errMsg = "The device could not be found. Try moving closer.";
        Toast.show(errMsg);
        startScan();
        setCharacteristicStatus("init");
        return Promise.reject(new Error(errMsg));
      }

      setCharacteristicStatus("loading");

      const isConnected = await BleManager.isPeripheralConnected(mac, [
        serviceId,
      ]);

      // console.log(`are we connected? ${isConnected ? "yes" : "no"}`);

      function rejectAfterMs(ms: number, msg: string) {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error(msg)), ms);
        });
      }

      let errMsg = "Unable to find device. Try moving closer.";

      if (!isConnected) {
        // console.log("trying to connect");
        try {
          await BleManager.connect(mac);
        } catch (e) {
          console.log(e);
          Toast.show(errMsg);
          setCharacteristicStatus("error");
          setConStatus("error");
          return Promise.reject(new Error(errMsg));
        }
      }

      errMsg = "Unable to retrieve services";
      try {
        const timeout = rejectAfterMs(5000, errMsg);
        const servicesPromise = BleManager.retrieveServices(mac);
        const services = await Promise.race([timeout, servicesPromise]);

        console.log({ services });

        if (!services) {
          Toast.show(errMsg);
          return Promise.reject(new Error("Error, no services"));
        }
      } catch (e) {
        Toast.show(errMsg);
        return Promise.reject(new Error(errMsg));
      }

      errMsg = "Unable to start characteristic notification";
      try {
        const timeout = rejectAfterMs(5000, errMsg);
        const notificationPromise = BleManager.startNotification(
          mac,
          serviceId,
          DEVICE.characteristics.wifiCharacteristic.uuid
        );
        const notification = await Promise.race([timeout, notificationPromise]);
        console.log(notification);
      } catch (e) {
        Toast.show(errMsg);
        return Promise.reject(new Error(errMsg));
      }

      errMsg = "Unable to start custom command notification";
      try {
        const timeout = rejectAfterMs(5000, errMsg);
        const notificationPromise = BleManager.startNotification(
          mac,
          serviceId,
          DEVICE.characteristics.customCommandNotify.uuid
        );
        const notification = await Promise.race([timeout, notificationPromise]);
        console.log(notification);
      } catch (e) {
        Toast.show(errMsg);
        return Promise.reject(new Error(errMsg));
      }

      errMsg = "Unable to write to device";

      try {
        const timeout = rejectAfterMs(5000, errMsg);
        const writePromise = BleManager.write(
          mac,
          serviceId,
          DEVICE.characteristics.inputSep.uuid,
          data
        );
        const write = await Promise.race([timeout, writePromise]);
        console.log(write);
      } catch (e) {
        Toast.show(errMsg);
        return Promise.reject(new Error(errMsg));
      }

      return Promise.resolve(true);
    },
    [devices, startScan]
  );

  const sendRebootCommandExample = useCallback(async (mac: string) => {
    if (!mac)
      return Promise.reject(
        new Error(
          "No MAC saved. Please rescan for devices before attempting to write."
        )
      );

    try {
      const isConnected = await BleManager.isPeripheralConnected(mac, [
        serviceId,
      ]);

      if (!isConnected) {
        await BleManager.connect(mac);
      }

      await BleManager.retrieveServices(mac);

      await BleManager.startNotification(
        mac,
        serviceId,
        DEVICE.characteristics.customCommandNotify.uuid
      );

      const rebootKey = DEVICE.characteristics.reboot.uuid.substring(-4);

      const data = stringToBytes(`${DEVICE.key}%&%${rebootKey}&#&`, 20);

      // console.log(String.fromCharCode(...data));

      await BleManager.write(
        mac,
        serviceId,
        DEVICE.characteristics.customCommand.uuid,
        data
      );
    } catch (err) {
      console.log({ err });
    }

    return true;
  }, []);

  const value = useMemo(
    () => ({
      isInitialized,
      permissionsGranted,
      conStatus,
      characteristicStatus,
      isScanning,
      piCharacteristic,
      devices,
      btPermissionError,
      setBTPermissionError,
      sendRebootCommandExample,
      sendDataToDevice,
      connectToDevice,
      setIsUsingBluetooth,
      startScan,
      btIsActive,
    }),
    [
      btPermissionError,
      setBTPermissionError,
      isInitialized,
      isScanning,
      devices,
      permissionsGranted,
      piCharacteristic,
      sendRebootCommandExample,
      conStatus,
      characteristicStatus,
      sendDataToDevice,
      connectToDevice,
      setIsUsingBluetooth,
      startScan,
      btIsActive,
    ]
  );

  return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
};

export default BleContext;
