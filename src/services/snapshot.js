/** Camera snapshot handling: downscale and compress so localStorage stays small. */

import { SNAPSHOT } from '../config.js';

/**
 * @param {File} file An image chosen or captured by the user.
 * @returns {Promise<string>} A JPEG data URL no wider than SNAPSHOT.maxWidth.
 */
export function compressImage(file, { maxWidth = SNAPSHOT.maxWidth, quality = SNAPSHOT.jpegQuality } = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.naturalWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };

    img.src = url;
  });
}
