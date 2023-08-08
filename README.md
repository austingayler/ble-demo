## Intro

An example context wrapper for a simple React Native app that handles the following things. During development with Bluetooth I ran into many many many more gotchas than normal development, and wanted to share my robust-feeling wrapper I settled on. Some of the things that make development with Bluetooth & React Native difficult:

* Ensuring that the bluetooth module and listeners are correctly initialized between hot reloads and full app reloads. Sometimes I have run into bugs because these don't always initialize, or initialize twice, etc. In React using a useRef helps keep this under control.

* Consistent permission checking, needed for example if the user allows the permission only "Just once"

* The need to perform many consecutive BT commands in a row in order to, for example, write data to a device: `connect` -> `isPeripheralConnected`? -> `retrieveServices` -> `startNotification` -> `write`. There are many opportunities for something to fail and more detailed error handling can prevent a lot of headache.

## Features

* does not initialize BT until explicitly started by a component
* only prompts for bluetooth permission when explicitly prompted by a component
  * for best UX, we don't want this, so we can't do the easy path of calling `BleManager.start` on app start
* ensures only BleManagerModule is used 
    * important as per the docs
* ensures only one update, discover and stop listener exists for the app
    * I found without this, it could cause some subtle bugs because of hot reloading
* performs a permissions check before each operation 
    * important, as the user can revoke permissions at any time
    * the context saves the specific permission error to a variable for a consuming component to render
* stores the connected device(s) in the local storage to avoid having to scan again
    * for best UX. Scanning is inconsistent and failure-prone at its worst.
* shows the status (init, success, error, loading) of the connection attempt to a device
    * if you're dealing with a hardware device that inconsistently connects, or can disconnect, etc, having this status is extremely helpful
* shows the status (init, success, error, loading) of getting characteristic data from a device
    * helpful to know what the internals are doing when trying to get some data from the hardware. I have found this super helpful because the hardware I work with sends data rather inconsistently and sometimes erroneously.
* can write data to a connected device
    * contains an example using all the required successive function calls, and in a defensive style. Very useful to have a race condition with a N second timeout in order to potentially figure out which BT commands aren't working.
* has extremely defensive and fine-grained error handling for scanning and data writing
* adds a promise timeout/race condition to certain function calls which don't implement a timeout, and can just hang indefinitely
* even includes the most mysterious part of the code, needing to call the `scan` function twice to find and connect to the device I work with. Perhaps this is just an anomoly with my specific hardware, but through a fluke I got all the BT working by calling this function twice, which definitely is not documented anywhere on the 'net. Maybe this helps someone else who's ready to throw their laptop out the window. (if anyone can explain this to me, that'd be....amazing). This shouldn't be necessary in normal use (so you can change it to just call `scan` once), but it wouldn't work with my hardware otherwise. 


## Setup
If you're here, you're in deep in the Bluetooth and already know how to set up a React Native project. 