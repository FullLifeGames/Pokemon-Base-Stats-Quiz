import type { Ref } from 'vue'

export function useLocalePreference(locale: Ref<string>) {
  const changeLocale = (newLocale: string) => {
    locale.value = newLocale
    localStorage.setItem('locale', newLocale)
  }

  return {
    changeLocale,
  }
}
