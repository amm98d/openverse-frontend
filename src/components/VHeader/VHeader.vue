<template>
  <div class="fixed flex py-2 px-8 align-center z-40 w-full bg-white">
    <NuxtLink to="/">
      <VLogoLoader />
    </NuxtLink>
    <VFilterButton />
  </div>
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import VLogoLoader from '~/components/VLogoLoader/VLogoLoader'
import VFilterButton from '~/components/VHeader/VFilterButton'

const VHeader = defineComponent({
  name: 'VHeader',
  components: {
    VFilterButton,
    VLogoLoader,
  },
})

export default VHeader
</script>
