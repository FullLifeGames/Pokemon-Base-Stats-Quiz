<template>
  <span v-if="icon" :style="icon.style" />
</template>

<script setup lang="ts">
import { Icons } from "@pkmn/img";
const properties = defineProps<{
  name?: string | null;
}>();
const icon = computed(() => {
  if (properties.name) {
    return Icons.getPokemon(properties.name);
  }
  return null;
});
</script>
