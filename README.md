# PNG

Simple Typescript PNG creation class.

Just paste this class into your code and you're living large.

### Usage
```typescript
// Note: PNG spec requires 16 and 32 bit data to be big-endian
const imageData: Uint8Buffer =  <raw image data>

const png = new PNG(tileSize, tileSize, 16, PNGColorType.Greyscale)
const pngData = await png.compress(imageData, PNGCompression.BestCompression)
```

Dependencies:

* zlib

