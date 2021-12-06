<template>
  <VButton variant="action-menu" @click="toggleFilters">
    <FilterIcon v-show="showIcon" class="w-5 h-5" :class="iconPadding" />
    <span>{{ buttonLabel }}</span>
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
    const iconPadding = computed(() => {
      return buttonLabel.value === '' ? '' : 'me-4'
    })
    const toggleFilters = () => {
      store.commit(`${SEARCH}/${SET_FILTER_IS_VISIBLE}`, {
        isFilterVisible: !store.state.search.isFilterVisible,
      })
    }

    return {
      buttonLabel,
      showIcon,
      iconPadding,

      toggleFilters,
    }
  },
})

export default VFilterButton
</script>
