<script setup lang="ts">
import { FnbTabs, FnbTabPane } from 'fnb-ui'
</script>

<template>
  <!-- Uncontrolled (no v-model) + segment type + small size -->
  <FnbTabs type="segment" size="small">
    <FnbTabPane name="day" tab="Day">
      <p>Uncontrolled: clicking just works, no v-model required.</p>
    </FnbTabPane>
    <FnbTabPane name="week" tab="Week">
      <p>type="segment" gives the boxed, equal-width nav.</p>
    </FnbTabPane>
    <FnbTabPane name="month" tab="Month">
      <p>size="small" tightens the padding.</p>
    </FnbTabPane>
  </FnbTabs>
</template>
