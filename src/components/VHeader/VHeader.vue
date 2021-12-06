<template>
  <div class="bg-white w-full z-20 fixed">
    <VFilterButton @toggle="toggleFilter" />
  </div>
</template>

<script>
import VFilterButton from '~/components/VHeader/VFilterButton'
import { defineComponent } from '@nuxtjs/composition-api'

const VHeader = defineComponent({
  name: 'VHeader',
  components: {
    VFilterButton,
  },
})

export default VHeader
</script>
