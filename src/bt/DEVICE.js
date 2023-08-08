export default {
  name: "raspberrypi",
  key: "pisugar",
  service: "fd2b4448-aa0f-4a15-a62f-eb0be77a0000",
  characteristics: {
    serviceName: {
      uuid: "fd2b4448-aa0f-4a15-a62f-eb0be77a0001",
      property: "read",
    },
    deviceModel: {
      uuid: "fd2b4448-aa0f-4a15-a62f-eb0be77a0002",
      property: "read",
    },
    wifiCharacteristic: {
      uuid: "fd2b4448-aa0f-4a15-a62f-eb0be77a0003",
      property: "notify",
    },
    ipAddr: {
      uuid: "fd2b4448-aa0f-4a15-a62f-eb0be77a0004",
      property: "notify",
    },
    notifyMessage: {
      uuid: "fd2b4448-aa0f-4a15-a62f-eb0be77a0006",
      property: "notify",
    },
    inputSep: {
      uuid: "fd2b4448-aa0f-4a15-a62f-eb0be77a0007",
      property: "write",
    },
    customCommand: {
      uuid: "fd2b4448-aa0f-4a15-a62f-eb0be77a0008",
      property: "write",
    },
    customCommandNotify: {
      uuid: "fd2b4448-aa0f-4a15-a62f-eb0be77a0009",
      property: "notify",
    },
    cpuTemp: { uuid: "00000000-0000-0000-0000-fd2bccca0001", property: "read" },
    cpuTempNotify: {
      uuid: "00000000-0000-0000-0000-fd2bcccb0001",
      property: "notify",
    },
    cpuLoad: { uuid: "00000000-0000-0000-0000-fd2bccca0002", property: "read" },
    cpuLoadNotify: {
      uuid: "00000000-0000-0000-0000-fd2bcccb0002",
      property: "notify",
    },
    memory: { uuid: "00000000-0000-0000-0000-fd2bccca0003", property: "read" },
    memoryNotify: {
      uuid: "00000000-0000-0000-0000-fd2bcccb0003",
      property: "notify",
    },
    uptime: { uuid: "00000000-0000-0000-0000-fd2bccca0004", property: "read" },
    uptimeNotify: {
      uuid: "00000000-0000-0000-0000-fd2bcccb0004",
      property: "notify",
    },
    shutdown: {
      uuid: "00000000-0000-0000-0000-fd2bcccc0001",
      property: "read",
    },
    reboot: { uuid: "00000000-0000-0000-0000-fd2bcccc0002", property: "read" },
  },
};
