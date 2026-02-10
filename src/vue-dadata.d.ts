/**
 * Объявление модуля vue-dadata: в пакете есть типы в dist/index.d.ts,
 * но package.json "exports" не указывает на них, поэтому TypeScript не находит декларации.
 */
declare module 'vue-dadata' {
  import type { Component } from 'vue'

  export const VueDadata: Component

  export interface Suggestion {
    value: string
    unrestricted_value: string
    data: {
      geo_lat: string
      geo_lon: string
      [key: string]: unknown
    }
  }
}
