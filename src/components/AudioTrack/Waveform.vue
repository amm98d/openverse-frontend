<template>
  <div
    ref="el"
    class="waveform relative bg-dark-charcoal-06 overflow-hidden focus:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-pink"
    :style="{ '--unusable-height': `${Math.floor((1 - usableFrac) * 100)}%` }"
    tabIndex="0"
    role="slider"
    :aria-label="$t('waveform.label')"
    aria-orientation="horizontal"
    aria-valuemin="0"
    :aria-valuemax="duration"
    :aria-valuenow="currentTime"
    :aria-valuetext="currentTimeText"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseLeave"
    @keydown.arrow-left.prevent="handleArrowKeys"
    @keydown.arrow-right.prevent="handleArrowKeys"
    @keydown.home.prevent="handlePosKeys(0)"
    @keydown.end.prevent="handlePosKeys(1)"
  >
    <!-- Progress bar -->
    <svg
      class="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      :viewBox="viewBox"
      preserveAspectRatio="none"
    >
      <rect
        v-if="isReady"
        class="fill-yellow"
        x="0"
        y="0"
        :width="progressBarWidth"
        height="100%"
      />
    </svg>

    <!-- Bars -->
    <svg
      class="bars absolute bottom-0 w-full"
      :style="{ '--usable-height': `${Math.floor(usableFrac * 100)}%` }"
      xmlns="http://www.w3.org/2000/svg"
      :viewBox="viewBox"
      preserveAspectRatio="none"
    >
      <rect
        v-for="(peak, index) in normalizedPeaks"
        :key="index"
        class="transform origin-bottom transition-transform duration-500"
        :class="[
          isReady ? 'scale-y-100' : 'scale-y-0',
          index <= seekIndex ? 'fill-black' : 'fill-dark-charcoal-20-alpha',
        ]"
        :x="spaceBefore(index)"
        :y="spaceAbove(index)"
        :width="barWidth"
        :height="peak"
      />
    </svg>

    <!-- Keyboard focus -->
    <div
      class="focus-indicator hidden absolute z-20 top-0 flex flex-col items-center justify-between bg-black h-full"
      :style="{ width: `${barWidth}px`, left: `${seekSpaceBefore}px` }"
    >
      <div
        v-for="(classes, name) in {
          top: ['-translate-y-1/2'],
          bottom: ['translate-y-1/2'],
        }"
        :key="name"
        class="rounded-full bg-black h-2 w-2 transform"
        :class="classes"
      >
        &nbsp;
      </div>
    </div>

    <!-- Timestamps -->
    <template v-if="isReady">
      <div
        ref="progressTimestampEl"
        class="progress timestamp z-10 transform"
        :class="[
          ...(isProgressTimestampCutoff
            ? ['bg-dark-charcoal-06']
            : ['bg-yellow', '-translate-x-full']),
        ]"
        :style="{ '--progress-time-left': `${progressBarWidth}px` }"
      >
        {{ timeFmt(progressTimestamp) }}
      </div>
      <div
        v-if="seekFrac"
        ref="seekTimestampEl"
        class="seek timestamp transform"
        :class="{ '-translate-x-full': !isSeekTimestampCutoff }"
        :style="{ '--seek-time-left': `${seekBarWidth}px` }"
      >
        {{ timeFmt(seekTimestamp) }}
      </div>
      <div
        v-if="showDuration"
        class="duration timestamp right-0 bg-dark-charcoal-06"
      >
        {{ timeFmt(duration) }}
      </div>
    </template>

    <!-- Message overlay -->
    <div
      v-else
      class="absolute inset-0 flex items-center justify-center loading font-bold text-xs"
    >
      {{ message }}
    </div>
  </div>
</template>

<script>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
} from '@nuxtjs/composition-api'
import { downsampleArray, upsampleArray } from '~/utils/resampling'

/**
 * Renders an SVG representation of the waveform given a list of heights for the
 * bars.
 */
export default {
  name: 'Waveform',
  props: {
    /**
     * an array of heights of the bars; The waveform will be generated with
     * bars of random length if the prop is not provided.
     */
    peaks: {
      type: Array,
      required: false,
      default: () => Array.from({ length: 100 }, () => Math.random()),
      validator: (val) => val.every((item) => item >= 0 && item <= 1),
    },
    /**
     * the message to display instead of the waveform; This is useful when
     * displaying a loading or error state.
     */
    message: {
      type: String,
    },
    /**
     * the current play time of the audio track
     */
    currentTime: {
      type: Number,
      default: 0,
    },
    /**
     * the total play time of the audio track
     */
    duration: {
      type: Number,
      default: 0,
    },
    /**
     * whether to show the duration of the audio at the ending edge
     */
    showDuration: {
      type: Boolean,
      default: false,
    },
    /**
     * the fraction of the waveform height to use for the bars and timestamp;
     * The remaining space can be used to place other elements.
     */
    usableFrac: {
      type: Number,
      default: 1,
    },
  },
  setup(props, { emit }) {
    /* Utils */

    /**
     * Format the time as hh:mm:ss, dropping the hour part if it is zero.
     * @param {number} seconds - the number of seconds in the duration
     * @returns {string} the duration in a human-friendly format
     */
    const timeFmt = (seconds) => {
      const date = new Date(0)
      date.setSeconds(seconds)
      return date.toISOString().substr(11, 8).replace(/^00:/, '')
    }
    /**
     * Get the x-coordinate of the event with respect to the bounding box of the
     * waveform.
     * @param {MouseEvent} event - the event from which to get the position
     * @returns {number} the x-position of the event inside the waveform
     */
    const getPosition = (event) => {
      return event.clientX - el.value.getBoundingClientRect().x
    }
    /**
     * Get the x-position of the event with respect to the bounding box of the
     * waveform, as a fraction of the waveform width.
     * @param {MouseEvent} event - the event from which to get the position
     * @returns {number} the x-position of the event as a fraction
     */
    const getPositionFrac = (event) => {
      const xPos = getPosition(event)
      return xPos / waveformWidth.value
    }
    /**
     * Get the number of peaks that will fit within the given width.
     * @param {number} width - the number of pixels inside which to count peaks
     * @returns {number} the number of peaks that can be accommodated
     */
    const getPeaksInWidth = (width) => {
      return Math.floor((width - barGap) / (barWidth + barGap))
    }

    /* Element dimensions */

    const el = ref(null) // template ref
    const waveformWidth = ref(0)
    const updateWaveformWidth = () => {
      waveformWidth.value = el.value.clientWidth
    }
    let observer
    onMounted(() => {
      observer = new ResizeObserver(updateWaveformWidth)
      observer.observe(el.value)
      updateWaveformWidth()
    })
    onBeforeUnmount(() => {
      if (observer) {
        observer.disconnect()
      }
    })

    /* State */

    const isReady = computed(() => !props.message)

    /* Resampling */

    const barWidth = 2
    const barGap = 2
    const peakCount = computed(() => getPeaksInWidth(waveformWidth.value))
    const normalizedPeaks = computed(() => {
      const givenLength = props.peaks.length
      const required = peakCount.value
      if (givenLength < required) {
        return upsampleArray(props.peaks, required)
      } else if (givenLength > required) {
        return downsampleArray(props.peaks, required)
      }
      return props.peaks
    })

    /* SVG drawing */

    const viewBox = computed(() => `0 0 ${waveformWidth.value} 1`)
    const spaceBefore = (index) => index * barWidth + (index + 1) * barGap
    const spaceAbove = (index) => 1 - normalizedPeaks.value[index]

    /* Progress bar */

    const currentFrac = computed(() =>
      isReady.value ? props.currentTime / props.duration : 0
    )
    const progressBarWidth = computed(() => {
      const frac = isDragging.value ? seekFrac.value : currentFrac.value
      return waveformWidth.value * frac
    })

    /* Progress timestamp */

    const progressTimestampEl = ref(null)
    const progressTimestamp = computed(() =>
      isDragging.value ? seekTimestamp.value : props.currentTime
    )
    const isProgressTimestampCutoff = computed(() => {
      if (!progressTimestampEl.value) return false
      const barWidth = progressBarWidth.value
      const timestampWidth = progressTimestampEl.value.offsetWidth
      return barWidth < timestampWidth + 2
    })

    /* Seek bar */

    const seekFrac = ref(null)
    const seekBarWidth = computed(() => {
      const frac = seekFrac.value ?? currentFrac.value
      return waveformWidth.value * frac
    })
    const seekIndex = computed(() => getPeaksInWidth(seekBarWidth.value))
    const seekSpaceBefore = computed(() => spaceBefore(seekIndex.value))

    /* Seek timestamp */

    const seekTimestampEl = ref(null)
    const seekTimestamp = computed(() => seekFrac.value * props.duration)
    const isSeekTimestampCutoff = computed(() => {
      if (!seekTimestampEl.value) return false
      const barWidth = seekBarWidth.value
      const timestampWidth = seekTimestampEl.value.offsetWidth
      return barWidth < timestampWidth + 2
    })

    /* Seeking */

    const seekDelta = 1 // s
    const modSeekDelta = 15 // s
    /**
     * the seek jump length as a % of the track
     */
    const seekDeltaFrac = computed(() => {
      return isReady.value ? seekDelta / props.duration : 0
    })
    const modSeekDeltaFrac = computed(() =>
      isReady.value ? modSeekDelta / props.duration : 0
    )
    const setSeekProgress = (event) => {
      seekFrac.value = getPositionFrac(event)
    }
    const clearSeekProgress = () => {
      seekFrac.value = null
    }
    const seek = (event) => {
      emit('seeked', getPositionFrac(event))
    }

    /* Dragging */

    const dragThreshold = 2 // px
    let startPos = null
    const isDragging = ref(false)
    const handleMouseDown = (event) => {
      isDragging.value = false
      startPos = getPosition(event)
      setSeekProgress(event)
    }
    const handleMouseMove = (event) => {
      if (startPos) {
        const clickPos = getPosition(event)
        if (Math.abs(clickPos - startPos) > dragThreshold) {
          isDragging.value = true
        }
      }
      setSeekProgress(event)
    }
    const handleMouseUp = (event) => {
      isDragging.value = false
      startPos = null
      seek(event)
    }
    const handleMouseLeave = () => {
      clearSeekProgress()
    }

    /* Keyboard */

    const handlePosKeys = (frac) => {
      clearSeekProgress()
      emit('seeked', frac)
    }
    const handleArrowKeys = (event) => {
      const { key, shiftKey, metaKey } = event
      if (metaKey) {
        // Always false on Windows
        handlePosKeys(key.includes('Left') ? 0 : 1)
      } else {
        clearSeekProgress()
        const direction = key.includes('Left') ? -1 : 1
        const magnitude = shiftKey
          ? modSeekDeltaFrac.value
          : seekDeltaFrac.value
        const delta = magnitude * direction
        emit('seeked', currentFrac.value + delta)
      }
    }

    return {
      timeFmt,

      el, // template ref

      isReady,

      barWidth,
      normalizedPeaks,

      viewBox,
      spaceBefore,
      spaceAbove,

      progressBarWidth,
      progressTimestamp,
      progressTimestampEl,
      isProgressTimestampCutoff,

      seekFrac,
      seekBarWidth,
      seekIndex,
      seekSpaceBefore,

      seekTimestamp,
      seekTimestampEl,
      isSeekTimestampCutoff,

      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleMouseLeave,

      handlePosKeys,
      handleArrowKeys,
    }
  },
  computed: {
    /**
     * the waveform current time as a text string; This function was placed
     * outside because `this` is not accessible inside the `setup`.
     */
    currentTimeText() {
      const time = this.timeFmt(this.currentTime)
      return this.$t('waveform.current-time', { time })
    },
  },
}
</script>

<style scoped lang="css">
.timestamp {
  @apply absolute font-bold text-xs px-1 pointer-events-none;
  top: calc(var(--unusable-height) + theme('spacing[0.5]'));
}

.bars {
  height: calc(var(--usable-height) - 1rem - 2 * theme('spacing[0.5]'));
}

.progress {
  left: var(--progress-time-left);
}

.seek {
  left: var(--seek-time-left);
}

.waveform:focus-visible .focus-indicator {
  display: flex;
}

.fill-dark-charcoal-20-alpha {
  fill: rgba(48, 39, 46, 0.2);
}
</style>
