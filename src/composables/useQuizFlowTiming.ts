import { onUnmounted, ref } from 'vue'

export function useQuizFlowTiming() {
  const elapsedTime = ref(0)
  const progressValue = ref(0)

  let timerInterval: ReturnType<typeof setInterval> | null = null
  let loadingInterval: ReturnType<typeof setInterval> | null = null

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      elapsedTime.value++
    }, 1000)
  }

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  const resetElapsedTime = () => {
    elapsedTime.value = 0
  }

  const resetProgress = () => {
    progressValue.value = 0
    if (loadingInterval) {
      clearInterval(loadingInterval)
      loadingInterval = null
    }
  }

  const runLoadingTransition = (onDone: () => void, delayMs = 500) => {
    resetProgress()
    loadingInterval = setInterval(() => {
      progressValue.value += Math.random() * 5
      if (progressValue.value >= 100) {
        progressValue.value = 100
        if (loadingInterval) {
          clearInterval(loadingInterval)
          loadingInterval = null
        }
        setTimeout(onDone, delayMs)
      }
    }, 100)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  onUnmounted(() => {
    stopTimer()
    resetProgress()
  })

  return {
    elapsedTime,
    progressValue,
    startTimer,
    stopTimer,
    resetElapsedTime,
    resetProgress,
    runLoadingTransition,
    formatTime,
  }
}
