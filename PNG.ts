///
/// EarthBrowser
///
/// Created by Matt Giger on 4/16/2024
/// Copyright (c) 2024 Geodata Labs
///

import { deflateSync } from "zlib"

export enum PNGColorType {
	Greyscale = 0,
	Truecolour = 2,
	IndexedColor = 3,
	GreyscaleWithAlpha = 4,
	TruecolourWithAlpha = 6,
}

export enum PNGCompression {
	NoCompression = 0,
	BestSpeed = 1,
	MidCompression = 6,
	BestCompression = 9,
}

export type PNGBitDepth = 1 | 2 | 4 | 8 | 16 | 32

export class PNG {
	public width: number
	public height: number
	public bitDepth: PNGBitDepth
	public colorType: PNGColorType

	constructor(width: number, height: number, bitDepth: PNGBitDepth, colorType: PNGColorType) {
		this.width = width
		this.height = height
		this.bitDepth = bitDepth
		this.colorType = colorType
	}

	public compress(imgData: Uint8Array, compression: PNGCompression = PNGCompression.BestSpeed): Uint8Array {
		const imageDataChunk = new IDAT(this.width, this.height, this.bitDepth)
		imageDataChunk.compress(imgData, compression)

		// add whatever chunks you want here right before the IEND chunk
		const chunks: PNGChunk[] = [
			new IHDR(this.width, this.height, this.bitDepth, this.colorType),
			new PLTE(),
			imageDataChunk,
			new PNGChunk(0x49454e44), // IEND
		]
		const cdata: Uint8Array[] = chunks.map(c => c.chunkData)
		const length = cdata.reduce((acc, block) => acc + block.length, 0)

		const block = new Uint8Array(length + 8)
		const data = new DataView(block.buffer)
		data.setUint32(0, 0x89504e47) // PNG magic number
		data.setUint32(4, 0x0d0a1a0a) // DOS line ending

		let offset = 8
		for(const d of cdata) {
			block.set(d, offset)
			offset += d.length
		}

		return block
	}
}

class PNGChunk {
	public type: number
	public data = new Uint8Array(0)

	constructor(type: number) {
		this.type = type
	}

	public get chunkData(): Uint8Array {
		const block = new Uint8Array(this.data.length + 12)
		const data = new DataView(block.buffer)
		data.setUint32(0, this.data.length)
		data.setUint32(4, this.type)

		block.set(this.data, 8)

		const crc = crc32(0, block, this.data.length + 4, 4)
		data.setUint32(8 + this.data.length, crc)
		return block
	}
}

class IHDR extends PNGChunk {
	constructor(public width: number, public height: number, public bitDepth: PNGBitDepth, public colorType: PNGColorType) {
		super(0x49484452)

		this.data = new Uint8Array(13)
		const view = new DataView(this.data.buffer)
		view.setUint32(0, width)
		view.setUint32(4, height)
		view.setUint8(8, bitDepth)
		view.setUint8(9, colorType)
		view.setUint8(10, 0) // compression
		view.setUint8(11, 0) // filter
		view.setUint8(12, 0) // interlace
	}
}

class PLTE extends PNGChunk {
	constructor() {
		super(0x504c5445)

		this.data = new Uint8Array(3)
		this.data[0] = 0	// red
		this.data[1] = 0	// green
		this.data[2] = 0	// blue
	}
}

class IDAT extends PNGChunk {
	public width: number
	public height: number
	public bitDepth: number

	constructor(width: number, height: number, bitDepth: number) {
		super(0x49444154)

		this.width = width
		this.height = height
		this.bitDepth = bitDepth
	}

	public compress(imgData: Uint8Array, compression: PNGCompression): void {
		const filterType = 0	// Add filtering here
		const byteWidth = Math.ceil(this.width * this.bitDepth / 8)
		const rowWidth = byteWidth + 1
		const filterData = new Uint8Array(rowWidth * this.height)
		for(let i=0; i<this.height; i++) {
			filterData[i * rowWidth] = filterType
			filterData.set(imgData.subarray(i * byteWidth, (i + 1) * byteWidth), i * rowWidth + 1)
		}

		this.data = deflateSync(filterData, {level: compression, windowBits: 15, strategy: 3})
	}
}


const crcTable = makeTable()

function makeTable(): number[] {
	const table: number[] = []
	for (let n = 0; n < 256; n++) {
		let c = n
		for (let k = 0; k < 8; k++) {
			c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1))
		}
		table[n] = c
	}
	return table
}

function crc32(crc: number, buf: Uint8Array, len: number, pos: number): number {
	const end = pos + len
	crc ^= -1
	for (let i = pos; i < end; i++) {
		crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF]
	}
	return (crc ^ (-1))
}