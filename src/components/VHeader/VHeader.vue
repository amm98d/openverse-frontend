<template>
  <div class="fixed flex py-2 px-8 align-center z-40 w-full bg-white">
    <NuxtLink to="/">
      <VLogoLoader />
    </NuxtLink>
  </div>
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import VLogoLoader from '~/components/VLogoLoader/VLogoLoader'

const VHeader = defineComponent({
  name: 'VHeader',
  components: {
    VLogoLoader,
  },
})

export default VHeader
</script>
