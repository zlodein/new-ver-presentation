declare module 'jsvectormap'

// Типы пакета не поставляются; объявление для прохождения type-check
declare module '@floating-ui/vue' {
  import type { Ref } from 'vue'
  export type Placement =
    | 'top' | 'top-start' | 'top-end'
    | 'right' | 'right-start' | 'right-end'
    | 'bottom' | 'bottom-start' | 'bottom-end'
    | 'left' | 'left-start' | 'left-end'
  export function useFloating(
    referenceRef: Ref<HTMLElement | null>,
    floatingRef: Ref<HTMLElement | null>,
    options?: {
      placement?: Placement
      whileElementsMounted?: unknown
      middleware?: unknown[]
    }
  ): {
    floatingStyles: Ref<Record<string, string>>
    middlewareData: Ref<{ arrow?: { x?: number; y?: number } }>
    placement: Ref<Placement>
  }
  export function autoUpdate(
    reference: HTMLElement,
    floating: HTMLElement,
    update: () => void
  ): () => void
  export function offset(offset: number): unknown
  export function flip(options?: { fallbackAxisSideDirection?: string }): unknown
  export function shift(options?: { padding?: number }): unknown
  export function arrow(options?: { element: unknown; padding?: number }): unknown
}

declare module 'xlsx' {
  interface XLSXStatic {
    utils: {
      book_new: () => unknown
      book_append_sheet: (wb: unknown, ws: unknown, name: string) => void
      json_to_sheet: (data: unknown[]) => unknown
      aoa_to_sheet: (data: unknown[][]) => unknown
    }
    writeFile: (wb: unknown, filename: string) => void
  }
  const xlsx: XLSXStatic
  export = xlsx
}
