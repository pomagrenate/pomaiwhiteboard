import PORenderModule from "./wasm/po_render.js";

export interface PORenderWASMInstance {
  _po_wasm_bucket_fill: (
    pixelPtr: number,
    width: number,
    height: number,
    startX: number,
    startY: number,
    fillColor: number,
    targetColor: number,
    tolerance: number
  ) => number;
  _po_wasm_spatial_clear: () => void;
  _po_wasm_spatial_insert: (minX: number, minY: number, maxX: number, maxY: number) => void;
  _po_wasm_render_rectangle: (
    pixelPtr: number,
    width: number,
    height: number,
    x: number,
    y: number,
    w: number,
    h: number,
    strokeColor: number,
    backgroundColor: number,
    strokeWidth: number
  ) => void;
  _malloc: (bytes: number) => number;
  _free: (ptr: number) => void;
  HEAPU32: Uint32Array;
  HEAPF32: Float32Array;
}

let wasmInstance: PORenderWASMInstance | null = null;
let initPromise: Promise<PORenderWASMInstance> | null = null;

/**
 * Initializes and returns the compiled C++ WASM module instance.
 */
export async function getPORenderWASM(): Promise<PORenderWASMInstance> {
  if (wasmInstance) {
    return wasmInstance;
  }
  if (!initPromise) {
    initPromise = (async () => {
      const mod = await PORenderModule();
      wasmInstance = mod as unknown as PORenderWASMInstance;
      return wasmInstance;
    })();
  }
  return initPromise;
}
