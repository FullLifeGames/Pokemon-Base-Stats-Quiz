<template>
  <div
    v-if="sprite"
    style="display: flex; justify-content: center; align-items: bottom"
  >
    <img
      :src="sprite.url"
      :width="sprite.w"
      :height="sprite.h"
      :style="
        pixelatedUsed && sprite.pixelated ? 'imageRendering: pixelated;' : ''
      "
    />
  </div>
</template>

<script setup lang="ts">
import type { GenerationNum } from "@pkmn/dex";
import { Sprites } from "@pkmn/img";
const properties = defineProps<{
  generation: GenerationNum;
  name: string | null | undefined;
}>();
const pixelatedUsed = false;
const sprite = computed(() => {
  if (properties.name) {
    return Sprites.getPokemon(properties.name, {
      gen: properties.generation,
      shiny: Math.random() * 4096 < 1,
    });
  }
  return null;
});
</script>
