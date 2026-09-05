<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'

const { Layout } = DefaultTheme
</script>

<template>
  <FnbProvider class="fnb-grid">
    <Layout />
  </FnbProvider>
</template>
