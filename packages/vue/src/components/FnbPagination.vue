<template lang="pug">
nav.fnb-pagination(v-if='totalPages > 1', aria-label='分页导航')
  button.fnb-pagination__btn(
    :disabled='page <= 1',
    @click='goTo(page - 1)',
    aria-label='上一页'
  ) ‹
  template(v-for='p in visiblePages', :key='p')
    span.fnb-pagination__ellipsis(v-if='p === "..."') …
    button.fnb-pagination__btn(
      v-else,
      :class='{ "fnb-pagination__btn--active": p === page }',
      @click='goTo(+p)'
    ) {{ p }}
  button.fnb-pagination__btn(
    :disabled='page >= totalPages',
    @click='goTo(page + 1)',
    aria-label='下一页'
  ) ›
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const emit = defineEmits<{
  'update:page': [value: number]
}>()

const props = withDefaults(
  defineProps<{
    page?: number
    itemCount: number
    pageSize: number
    pageSlot?: number
  }>(),
  {
    page: 1,
    pageSlot: 7,
  }
)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.itemCount / props.pageSize))
)

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = props.page
  const slot = props.pageSlot

  if (total <= slot) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = [1]
  const half = Math.floor((slot - 2) / 2)
  let start = Math.max(2, current - half)
  let end = Math.min(total - 1, current + half)

  if (current - half < 2) {
    end = Math.min(total - 1, slot - 2)
  }
  if (current + half > total - 1) {
    start = Math.max(2, total - slot + 3)
  }

  if (start > 2) pages.push('...')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('...')
  pages.push(total)

  return pages
})

function goTo(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    emit('update:page', p)
  }
}
</script>
