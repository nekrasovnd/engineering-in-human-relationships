const MAX_AVATAR_FILE_SIZE_BYTES = 6 * 1024 * 1024;
const AVATAR_OUTPUT_SIZE = 256;
const AVATAR_OUTPUT_QUALITY = 0.84;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('read-failed'));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image-load-failed'));
    image.src = source;
  });
}

export async function prepareAvatarImage(file) {
  if (!file) {
    throw new Error('file-missing');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('invalid-file-type');
  }

  if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    throw new Error('file-too-large');
  }

  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const squareSize = Math.min(image.width, image.height);
  const cropX = (image.width - squareSize) / 2;
  const cropY = (image.height - squareSize) / 2;
  const canvas = document.createElement('canvas');

  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('canvas-unavailable');
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    cropX,
    cropY,
    squareSize,
    squareSize,
    0,
    0,
    AVATAR_OUTPUT_SIZE,
    AVATAR_OUTPUT_SIZE,
  );

  return canvas.toDataURL('image/jpeg', AVATAR_OUTPUT_QUALITY);
}
