import { onScopeDispose, unref, watch } from '@nuxtjs/composition-api'

const isString = (val) => typeof val === 'string'
/**
 *
 * @param args
 * @returns {stop|*}
 */
export function useEventListener(...args) {
  /** @type MaybeRef<EventTarget> | undefined */
  let target
  /** @type string */
  let event
  /** @type any */
  let listener
  /** @type any */
  let options

  if (isString(args[0])) {
    ;[event, listener, options] = args
    target = typeof window === 'undefined' ? undefined : window
  } else {
    ;[target, event, listener, options] = args
  }

  if (!target) return () => {}

  let cleanup = () => {}

  const stopWatch = watch(
    () => unref(target),
    (el) => {
      cleanup()
      if (!el) return

      el.addEventListener(event, listener, options)

      cleanup = () => {
        el.removeEventListener(event, listener, options)
        cleanup = () => {}
      }
    },
    { immediate: true, flush: 'post' }
  )

  const stop = () => {
    stopWatch()
    cleanup()
  }

  onScopeDispose(stop)

  return stop
}
