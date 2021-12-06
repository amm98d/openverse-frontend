<template>
  <div class="bg-white w-full z-20 fixed">
    <ContentSwitcher class="flex-grow" />
  </div>
</template>

<script>
import ContentSwitcher from '~/components/VHeader/ContentSwitcher.vue'
import { defineComponent } from '@nuxtjs/composition-api'

const VHeader = defineComponent({
  name: 'VHeader',
  components: {
    ContentSwitcher,
  },
})

export default VHeader
</script>
