<template lang="pug">
.fnb-image(
  @click='previewSrc ? (showPreview = true) : undefined',
  :class='{ "fnb-image--preview": previewSrc }'
)
  img.fnb-image__img(
    :src='src',
    :alt='alt',
    loading='lazy',
    @error='handleError'
  )
Teleport(to='body')
  Transition(name='fnb-image-preview')
    .fnb-image__overlay(v-if='showPreview', @click='showPreview = false')
      img(:src='previewSrc || src', :alt='alt')
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const props = defineProps<{
  src: string
  alt?: string
  previewSrc?: string
  fallback?: string
}>()

const showPreview = ref(false)

function handleError(e: Event) {
  if (props.fallback) {
    ;(e.target as HTMLImageElement).src = props.fallback
  }
}
</script>
