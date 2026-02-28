interface UseSoloQuizLifecycleOptions {
  resetProgress: () => void
  resetElapsedTime: () => void
  startTimer: () => void
  onResetState: () => void | Promise<void>
  onAdvanceState: () => void | Promise<void>
}

export function useSoloQuizLifecycle(options: UseSoloQuizLifecycleOptions) {
  const resetQuiz = async () => {
    options.resetProgress()
    options.resetElapsedTime()
    await options.onResetState()
    options.startTimer()
  }

  const advanceQuestion = async () => {
    options.resetProgress()
    await options.onAdvanceState()
    options.startTimer()
  }

  return {
    resetQuiz,
    advanceQuestion,
  }
}
