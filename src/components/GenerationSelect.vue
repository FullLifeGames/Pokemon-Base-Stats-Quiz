<script setup lang="ts">
interface Props {
  modelValue: number;
  label?: string;
}

interface Emits {
  (e: "update:modelValue", value: number): void;
}

defineProps<Props>();
defineEmits<Emits>();

const generations = [
  { value: 1, name: "Kanto" },
  { value: 2, name: "Johto" },
  { value: 3, name: "Hoenn" },
  { value: 4, name: "Sinnoh" },
  { value: 5, name: "Unova" },
  { value: 6, name: "Kalos" },
  { value: 7, name: "Alola" },
  { value: 8, name: "Galar" },
  { value: 9, name: "Paldea" },
];
</script>

<template>
  <div>
    <label v-if="label" class="block mb-2 font-semibold">{{ label }}</label>
    <select
      :value="modelValue"
      @change="
        (e) =>
          $emit(
            'update:modelValue',
            Number((e.target as HTMLSelectElement).value),
          )
      "
      class="w-full px-2 py-1 rounded-md border border-input bg-background cursor-pointer"
    >
      <option v-for="gen in generations" :key="gen.value" :value="gen.value" class="cursor-pointer">
        Gen {{ gen.value }} ({{ gen.name }})
      </option>
    </select>
  </div>
</template>
