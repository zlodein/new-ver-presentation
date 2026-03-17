<template>
  <div class="template1-cover absolute inset-0 flex flex-col overflow-hidden">
    <!-- Декоративные фигуры из PPTX (pixel-perfect по 960×540) -->
    <div
      v-for="(el, i) in layoutShapes"
      :key="i"
      class="template1-cover__shape"
      :style="getShapeStyle(el)"
    />
    <!-- Слоты контента по координатам elements -->
    <div
      v-if="imageStyle"
      class="template1-cover__slot template1-cover__slot--image absolute overflow-hidden"
      :style="imageStyle"
    >
      <slot name="image" />
    </div>
    <div
      v-if="titleStyle"
      class="template1-cover__slot template1-cover__slot--title absolute flex flex-col justify-center overflow-hidden"
      :style="titleStyle"
    >
      <slot name="title" />
    </div>
    <div
      v-if="priceStyle"
      class="template1-cover__slot template1-cover__slot--price absolute flex flex-col justify-end overflow-hidden"
      :style="priceStyle"
    >
      <slot name="price" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { getTemplate1Slide, toPercent, getShapeStyle as getShapeStyleFn } from '@/data/template-1-layout-utils'
import type { LayoutElement } from '@/data/template-1-layout-utils'

const coverLayout = computed(() => getTemplate1Slide(0))

const layoutShapes = computed<LayoutElement[]>(() => coverLayout.value?.layoutElements ?? [])

function getShapeStyle(el: LayoutElement): CSSProperties {
  return getShapeStyleFn(el) as CSSProperties
}

function slotStyle(p: { left: number; top: number; width: number; height: number }): CSSProperties {
  return {
    position: 'absolute',
    left: `${p.left}%`,
    top: `${p.top}%`,
    width: `${p.width}%`,
    height: `${p.height}%`,
  }
}

const imageStyle = computed<CSSProperties | null>(() => {
  const el = coverLayout.value?.elements?.[0]
  if (!el || el.type !== 'image') return null
  return slotStyle(toPercent(el.left, el.top, el.width, el.height))
})

const titleStyle = computed<CSSProperties | null>(() => {
  const el = coverLayout.value?.elements?.[1]
  if (!el) return null
  return slotStyle(toPercent(el.left, el.top, el.width, el.height))
})

const priceStyle = computed<CSSProperties | null>(() => {
  const el = coverLayout.value?.elements?.[2]
  if (!el) return null
  return slotStyle(toPercent(el.left, el.top, el.width, el.height))
})
</script>

<style scoped>
.template1-cover {
  font-family: inherit;
}
.template1-cover__shape {
  box-sizing: border-box;
}
.template1-cover__slot--image {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
}
.template1-cover__slot--image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.template1-cover__slot--title,
.template1-cover__slot--price {
  color: #1a1a1a;
  padding: 0 0.5rem;
  box-sizing: border-box;
}
.template1-cover__slot--title {
  background: rgba(255, 255, 255, 0.97);
}
.template1-cover__slot--price {
  background: rgba(255, 255, 255, 0.97);
}
</style>
