# ts-png

Simple Typescript .png format creation class.

Just paste this class into your code and you're living large.

### Usage
```typescript
// Note: PNG spec requires 16 and 32 bit data to be big-endian
const imageData: Uint8Array =  <raw image data>

// Compress image data into the .png format
const png = new PNG(width, height, 16, PNGColorType.Greyscale)
const pngData = png.compress(imageData, PNGCompression.BestCompression)
```

Dependencies:

* zlib

