<script setup lang="ts">
import { ref } from 'vue'
import { FnbTabs, FnbTabPane } from 'fnb-ui'

const active = ref('overview')
</script>

<template>
  <FnbTabs v-model:value="active">
    <FnbTabPane name="overview" tab="Overview">
      <p>Controlled with <code>v-model:value</code>. Current: {{ active }}</p>
    </FnbTabPane>
    <FnbTabPane name="specs" tab="Specs">
      <p>Hard borders, solid shadows, brand-filled active tab.</p>
    </FnbTabPane>
    <FnbTabPane name="reviews" tab="Reviews">
      <p>Each panel renders its own content.</p>
    </FnbTabPane>
  </FnbTabs>
</template>
