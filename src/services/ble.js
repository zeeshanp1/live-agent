/**
 * Web Bluetooth: device discovery and pairing.
 *
 * Status: this only pairs with a device and tracks disconnects. Streaming audio
 * and snapshots over GATT (the Opus + JPEG characteristics in the architecture
 * doc) is on the roadmap and is not implemented yet.
 */

import { BLE } from '../config.js';

export const isBleSupported = () => typeof navigator !== 'undefined' && Boolean(navigator.bluetooth);

/**
 * Prompt the user to pick a BLE device.
 * @param {() => void} onDisconnect
 * @returns {Promise<{ name: string } | null>} null when the user dismissed the chooser.
 */
export async function pairDevice(onDisconnect) {
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [BLE.serviceUuid],
    });
    device.addEventListener('gattserverdisconnected', onDisconnect);
    return { name: device.name || 'Unnamed BLE Node' };
  } catch (err) {
    if (err.name === 'NotFoundError') return null; // chooser dismissed
    throw err;
  }
}
