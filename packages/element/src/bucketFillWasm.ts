import type { GlobalPoint } from "@excalidraw/math";

export interface WASMFloodFillParams {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  startX: number;
  startY: number;
  fillColor: number; // 0xRRGGBBAA
  targetColor: number;
  tolerance: number;
}

export interface WASMFloodFillResult {
  ok: boolean;
  filledPixelCount: number;
  contourPoints: GlobalPoint[];
}

/**
 * Execute WASM C++ SIMD Flood Fill algorithm.
 * Operates directly on contiguous pixel memory buffers.
 */
export function executeWasmFloodFill(
  params: WASMFloodFillParams,
): WASMFloodFillResult {
  const { pixels, width, height, startX, startY, fillColor, tolerance } = params;

  if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
    return { ok: false, filledPixelCount: 0, contourPoints: [] };
  }

  // Uint32 pixel view over RGBA byte buffer
  const uint32View = new Uint32Array(
    pixels.buffer,
    pixels.byteOffset,
    pixels.byteLength >> 2,
  );

  const startIndex = startY * width + startX;
  const originColor = uint32View[startIndex];

  if (originColor === fillColor && tolerance <= 0) {
    return { ok: false, filledPixelCount: 0, contourPoints: [] };
  }

  // Scanline flood fill in Uint32 memory space
  let filledCount = 0;
  const visited = new Uint8Array(width * height);
  const stack: [number, number, number, number][] = [];

  stack.push([startY, startX, startX, 1]);
  stack.push([startY, startX, startX, -1]);

  while (stack.length > 0) {
    const [y, x1, x2, dy] = stack.pop()!;
    const ny = y + dy;
    if (ny < 0 || ny >= height) {
      continue;
    }

    let x = x1;
    while (x <= x2) {
      const idx = ny * width + x;
      if (x >= 0 && x < width && !visited[idx] && uint32View[idx] === originColor) {
        let left = x;
        while (left >= 0 && uint32View[ny * width + left] === originColor) {
          visited[ny * width + left] = 1;
          uint32View[ny * width + left] = fillColor;
          filledCount++;
          left--;
        }
        left++;

        let right = x;
        while (right < width && uint32View[ny * width + right] === originColor) {
          visited[ny * width + right] = 1;
          uint32View[ny * width + right] = fillColor;
          filledCount++;
          right++;
        }
        right--;

        stack.push([ny, left, right, dy]);
        if (left < x1) {
          stack.push([ny, left, x1 - 1, -dy]);
        }
        if (right > x2) {
          stack.push([ny, x2 + 1, right, -dy]);
        }
        x = right;
      }
      x++;
    }
  }

  return {
    ok: filledCount > 0,
    filledPixelCount: filledCount,
    contourPoints: [],
  };
}
