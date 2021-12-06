<template>
  <form
    class="search-bar group flex flex-row items-center"
    @submit.prevent="handleSearch"
  >
    <InputField
      v-model="text"
      v-bind="$attrs"
      class="flex-grow search-field"
      label-text="Search"
      :connection-sides="['end']"
      field-id="search-bar"
      type="search"
      name="q"
    >
      <!-- @slot Extra information such as loading message or result count goes here. -->
      <slot />
    </InputField>
    <SearchButton type="submit" />
  </form>
</template>

<script>
import { computed, defineComponent } from '@nuxtjs/composition-api'

import InputField from '~/components/InputField/InputField.vue'
import SearchButton from '~/components/VHeader/SearchBar/SearchButton.vue'

/**
 * Displays a text field for a search query and is attached to an action button
 * that fires a search request. The loading state and number of hits are also
 * displayed in the bar itself.
 */
const SearchBar = defineComponent({
  name: 'SearchBar',
  components: {
    InputField,
    SearchButton,
  },
  inheritAttrs: false,
  props: {
    /**
     * the search query given as input to the field
     */
    value: {
      type: String,
      default: '',
    },
  },
  setup(props, { emit }) {
    const text = computed({
      get() {
        return props.value
      },
      set(value) {
        // For some reason, the `input` event is fired twice,
        // with InputEvent as value the second time.
        if (typeof value === 'string') {
          emit('input', value)
        }
      },
    })

    const handleSearch = () => {
      emit('submit')
    }

    return {
      text,

      handleSearch,
    }
  },
})
export default SearchBar
</script>

<style>
/* Removes the cross icon to clear the field */
.search-field input[type='search']::-webkit-search-decoration,
.search-field input[type='search']::-webkit-search-cancel-button,
.search-field input[type='search']::-webkit-search-results-button,
.search-field input[type='search']::-webkit-search-results-decoration {
  -webkit-appearance: none;
}
</style>
