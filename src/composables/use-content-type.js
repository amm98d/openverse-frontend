import {
  computed,
  reactive,
  useContext,
  useRoute,
  useRouter,
} from '@nuxtjs/composition-api'
import { MEDIA, SEARCH } from '~/constants/store-modules'
import { FETCH_MEDIA, UPDATE_QUERY } from '~/constants/action-types'
import AllContentIcon from '~/assets/icons/all-content.svg?inline'
import ImageContentIcon from '~/assets/icons/image-content.svg?inline'
import AudioContentIcon from '~/assets/icons/audio-content.svg?inline'

export default function useContentType() {
  const { app, store } = useContext()
  const route = useRoute()
  const router = useRouter()

  const contentTypes = reactive([
    { id: 'all', icon: AllContentIcon },
    { id: 'image', icon: ImageContentIcon },
    { id: 'audio', icon: AudioContentIcon },
  ])

  const activeItem = computed(() => {
    return contentTypes.find(
      (item) => item.id === store.state.search.searchType
    )
  })

  const setActiveContentType = async (contentType) => {
    console.log('You clicked ', contentType)
    await store.dispatch(`${SEARCH}/${UPDATE_QUERY}`, {
      searchType: contentType,
    })
    const type = contentType === 'all' ? '' : contentType

    const newPath = app.localePath({
      path: `/search/${type}`,
      query: route.value.query,
    })
    router.push(newPath)
    await store.dispatch(`${MEDIA}/${FETCH_MEDIA}`, {
      mediaType: store.state.search.query.mediaType,
      ...route.value.query,
    })
  }
  return { setActiveContentType, activeItem, contentTypes }
}
