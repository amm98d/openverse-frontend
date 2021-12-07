<template>
  <VButton
    variant="action-menu"
    class="self-center"
    :pressed="sidebarVisible"
    @click="toggleFilters"
  >
    <FilterIcon v-show="showIcon" class="w-6 h-6" width="24" height="24" />
    <span class="filter-label">{{ buttonLabel }}</span>
  </VButton>
</template>

<script>
import FilterIcon from '~/assets/icons/filter.svg?inline'
import { computed, defineComponent, useContext } from '@nuxtjs/composition-api'
import { useMediaQuery } from '~/composables/use-media-query'
import { SEARCH } from '~/constants/store-modules'
import { SET_FILTER_IS_VISIBLE } from '~/constants/mutation-types'

const VFilterButton = defineComponent({
  name: 'FilterButton',
  components: {
    FilterIcon,
  },
  props: {
    /**
     * Whether the page has been scrolled. If true on mobile, the button
     * label is blank.
     */
    isScrolled: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { i18n, store } = useContext()
    // TODO(@obulat): add use-scroll composable to VHeader
    const { isScrolled = false } = props

    const defaultWindow = typeof window !== 'undefined' ? window : undefined
    const isTablet = useMediaQuery('(min-width: 640px)', defaultWindow)

    const appliedFilterTags = computed(
      () => store.getters['search/appliedFilterTags']
    )
    const isAnyFilterApplied = computed(
      () => appliedFilterTags.value.length > 0
    )
    const buttonLabel = computed(() => {
      if (isTablet.value) {
        return i18n.t('header.filter-button.simple')
      }
      return isScrolled.value || !isAnyFilterApplied.value
        ? ''
        : i18n.tc(
            'header.filter-button.with-count',
            appliedFilterTags.value.length
          )
    })
    const showIcon = computed(() => {
      if (isTablet.value) {
        return true
      }
      return !isAnyFilterApplied.value
    })

    const sidebarVisible = computed(() => {
      return store.state.search.isFilterVisible
    })
    const toggleFilters = () => {
      store.commit(`${SEARCH}/${SET_FILTER_IS_VISIBLE}`, {
        isFilterVisible: !store.state.search.isFilterVisible,
      })
    }

    return {
      buttonLabel,
      sidebarVisible,
      showIcon,

      toggleFilters,
    }
  },
})

export default VFilterButton
</script>

<style>
/* Styling notes:
1. `align-self` for the button prevents its height from
growing to the parent's height.
2. Width and height set for the SVG prevent the flash of unstyled SVG,
where the svg is displayed incorrectly before the CSS has been loaded.
*/
.filter-label:not(:empty) {
  @apply ps-2;
}
</style>
