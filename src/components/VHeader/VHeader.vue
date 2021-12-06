<template>
  <div class="fixed flex py-4 px-8 align-center z-10 w-full bg-white">
    <SearchBar v-model="searchTerm" class="search-bar" @submit="handleSearch" />
  </div>
</template>

<script>
import SearchBar from '~/components/VHeader/SearchBar/SearchBar.vue'
import {
  computed,
  defineComponent,
  ref,
  useContext,
  useRouter,
} from '@nuxtjs/composition-api'
import { MEDIA, SEARCH } from '~/constants/store-modules'
import { FETCH_MEDIA, UPDATE_QUERY } from '~/constants/action-types'

const VHeader = defineComponent({
  name: 'VHeader',
  components: {
    SearchBar,
  },
  setup() {
    const { app, store } = useContext()
    const router = useRouter()

    const localSearchTerm = ref(store.state.search.query.q)
    const searchTerm = computed({
      get() {
        return localSearchTerm.value
      },
      async set(val) {
        localSearchTerm.value = val
      },
    })

    const handleSearch = async () => {
      const searchType = store.state.search.searchType
      await store.dispatch(`${SEARCH}/${UPDATE_QUERY}`, {
        q: localSearchTerm.value,
      })

      const newPath = app.localePath({
        path: `/search/${searchType === 'all' ? '' : searchType}`,
        query: store.getters['search/searchQueryParams'],
      })
      router.push(newPath)
      await store.dispatch(`${MEDIA}/${FETCH_MEDIA}`, {
        ...store.getters['search/searchQueryParams'],
      })
    }
    return {
      handleSearch,
      searchTerm,
    }
  },
})

export default VHeader
</script>
