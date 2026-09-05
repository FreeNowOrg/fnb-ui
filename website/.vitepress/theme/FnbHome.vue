<script setup lang="ts">
import { ref } from 'vue'

// The hero centrepiece is a live control group, not a picture of one. It is
// the spec's own worked example: a select, a field and a button joined into
// one pill with no override CSS in the consumer. Readers can press it.
const scope = ref('artworks')
const scopeOptions = [
  { label: 'Artworks', value: 'artworks' },
  { label: 'Novels', value: 'novels' },
  { label: 'Users', value: 'users' },
]
const query = ref('')

const tags = ['original', 'illustration', 'sensitive']
</script>

<template>
  <div class="home">
    <section class="hero">
      <h1 class="hero__name">fnb-ui</h1>
      <p class="hero__lede">
        Hard borders, offset shadows, zero radius. One stylesheet that works
        without a framework, plus Vue bindings when you want them.
      </p>

      <div class="hero__stage">
        <FnbInputGroup class="hero__pill">
          <FnbSelect v-model="scope" :options="scopeOptions" />
          <FnbInput v-model="query" placeholder="Search" />
          <FnbButton variant="primary">Search</FnbButton>
        </FnbInputGroup>
        <p class="hero__note">
          Live, not a screenshot. Three components joined by one class —
          <code>.fnb-input-group</code> — and no override CSS.
        </p>
      </div>

      <div class="hero__actions">
        <FnbButton size="lg" variant="primary" href="/guide/getting-started">
          Get started
        </FnbButton>
        <FnbButton size="lg" href="/components/button"
          >Browse components</FnbButton
        >
      </div>
    </section>

    <section class="proof">
      <div class="proof__col">
        <h2>Works without Vue</h2>
        <p>
          The stylesheet is the product. Write the class names in plain HTML and
          you get the whole system — buttons, fields, tables, prose.
        </p>
        <div class="proof__row">
          <button class="fnb-button">Plain</button>
          <button class="fnb-button fnb-button--primary">HTML</button>
        </div>
        <div class="proof__row">
          <span class="fnb-tag" v-for="t in tags" :key="t">{{ t }}</span>
        </div>
      </div>

      <div class="proof__col">
        <h2>Sizes that line up</h2>
        <p>
          Every single-line control shares one set of variables, so a button and
          a field at the same size are the same height. No per-use tweaking.
        </p>
        <div class="proof__row proof__row--stack">
          <div class="proof__pair">
            <FnbButton size="sm">Small</FnbButton>
            <FnbInput size="sm" model-value="28px" readonly />
          </div>
          <div class="proof__pair">
            <FnbButton>Medium</FnbButton>
            <FnbInput model-value="36px" readonly />
          </div>
          <div class="proof__pair">
            <FnbButton size="lg">Large</FnbButton>
            <FnbInput size="lg" model-value="44px" readonly />
          </div>
        </div>
      </div>

      <div class="proof__col">
        <h2>Retheme by two values</h2>
        <p>
          Semantic colours derive from the brand colour, so a new palette is a
          couple of custom properties — including the shadow in dark mode.
        </p>
        <div class="proof__row proof__themes">
          <span class="swatch swatch--blue">#4993ff</span>
          <span class="swatch swatch--pink">#ff5c8a</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--fnb-space-8) var(--fnb-space-6) var(--fnb-space-8);
}

/* --- Hero ---------------------------------------------------------------- */

.hero {
  padding-block: var(--fnb-space-8);
}

.hero__name {
  font-family: var(--fnb-font-display);
  font-size: clamp(3rem, 11vw, 6.5rem);
  line-height: 0.95;
  letter-spacing: -0.03em;
  margin: 0;
  color: var(--fnb-text);
}

.hero__lede {
  max-width: 34em;
  margin: var(--fnb-space-4) 0 0;
  font-size: 1.15rem;
  line-height: 1.6;
  color: var(--fnb-text-muted);
}

/* The stage gives the centrepiece room and a ground of its own, so the
   offset shadow reads against a flat fill rather than the page. */
.hero__stage {
  margin-top: var(--fnb-space-8);
  margin-right: var(--fnb-space-2);
  padding: var(--fnb-space-6);
  background: var(--fnb-bg);
  border: var(--fnb-w3-border) solid var(--fnb-border);
  box-shadow: var(--fnb-w4-shadow) var(--fnb-w4-shadow) 0 0
    var(--fnb-shadow-color);
}

.hero__pill {
  max-width: 100%;
}

.hero__note {
  margin: var(--fnb-space-4) 0 0;
  font-size: 0.9rem;
  color: var(--fnb-text-muted);
}

.hero__note code {
  background: var(--fnb-surface);
  border: 1px solid var(--fnb-divider);
  padding: 0 4px;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fnb-space-4);
  margin-top: var(--fnb-space-8);
}

/* --- Proof columns ------------------------------------------------------- */

.proof {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--fnb-space-8);
  margin-top: var(--fnb-space-8);
  padding-top: var(--fnb-space-8);
  border-top: var(--fnb-w3-border) solid var(--fnb-border);
}

.proof__col h2 {
  font-family: var(--fnb-font-display);
  font-size: 1.25rem;
  margin: 0 0 var(--fnb-space-2);
  color: var(--fnb-text);
}

.proof__col p {
  margin: 0;
  color: var(--fnb-text-muted);
  line-height: 1.6;
}

.proof__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--fnb-space-2);
  margin-top: var(--fnb-space-4);
}

.proof__row--stack {
  flex-direction: column;
  align-items: flex-start;
  gap: var(--fnb-space-3);
}

.proof__pair {
  display: flex;
  align-items: center;
  gap: var(--fnb-space-2);
}

.proof__pair :deep(.fnb-input) {
  width: 6rem;
}

.swatch {
  display: inline-flex;
  align-items: center;
  height: var(--fnb-control-h);
  padding-inline: var(--fnb-control-px);
  font-size: var(--fnb-control-font);
  font-weight: 900;
  color: var(--fnb-on-brand);
  border: var(--fnb-w3-border) solid var(--fnb-border);
  box-shadow: var(--fnb-w3-shadow) var(--fnb-w3-shadow) 0 0
    var(--fnb-shadow-color);
}

.swatch--blue {
  background: #4993ff;
}

.swatch--pink {
  background: #ff5c8a;
}

@media (max-width: 900px) {
  .proof {
    grid-template-columns: 1fr;
    gap: var(--fnb-space-6);
  }
}

@media (max-width: 640px) {
  .home {
    padding-inline: var(--fnb-space-4);
  }
  .hero__stage {
    padding: var(--fnb-space-4);
  }
}
</style>
