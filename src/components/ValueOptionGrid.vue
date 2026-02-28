<script setup lang="ts">
import { Button } from '@/components/ui/button'

withDefaults(defineProps<{
  options: number[]
  unit: string
  disabled?: boolean
  selectedOption?: number | null
}>(), {
  disabled: false,
  selectedOption: null,
})

const emit = defineEmits<{
  select: [value: number]
}>()

function handleSelect(option: number) {
  emit('select', option)
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mx-auto">
    <Button
      v-for="(option, index) in options"
      :key="option"
      :disabled="disabled"
      @click="handleSelect(option)"
      variant="outline"
      class="cursor-pointer w-full h-auto py-3 px-4 justify-start border-2 hover:border-primary/60 hover:bg-accent/70 transition-all"
      :class="{
        'border-primary bg-accent/80': selectedOption === option,
      }"
    >
      <span class="flex items-center justify-between w-full gap-4">
        <span class="text-xs font-semibold text-muted-foreground">
          {{ String.fromCharCode(65 + index) }}
        </span>
        <span class="font-mono text-lg font-bold text-foreground">
          {{ option }} {{ unit }}
        </span>
      </span>
    </Button>
  </div>
</template>