import { ControlAudioStore } from '@renderer/store/ControlAudio'
import { useGlobalPlayStatusStore } from '@renderer/store/GlobalPlayStatus'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { LocalUserDetailStore } from '@renderer/store/LocalUserDetail'

interface LyricWord {
  word: string
}

interface LyricLine {
  startTime: number
  endTime: number
  words: LyricWord[]
  translatedLyric?: string
}

const DESKTOP_LYRIC_SYNC_MS = 250
const MENU_BAR_LYRIC_SYNC_MS = 500

let installed = false
let installId = 0
let updateTimer: number | null = null
let stopWatchers: Array<() => void> = []
let ipcListeners: Array<{ channel: string; listener: (...args: any[]) => void }> = []

function buildLyricPayload(lines: LyricLine[]) {
  return JSON.parse(JSON.stringify(lines || []))
}

function computeLyricIndex(timeMs: number, lines: LyricLine[]) {
  if (!lines || lines.length === 0) return -1
  const index = lines.findIndex((line) => timeMs >= line.startTime && timeMs < line.endTime)
  if (index !== -1) return index

  for (let i = lines.length - 1; i >= 0; i--) {
    if (timeMs >= lines[i].startTime) return i
  }
  return -1
}

function clearUpdateTimer() {
  if (updateTimer !== null) {
    window.clearTimeout(updateTimer)
    updateTimer = null
  }
}

function getIpcRenderer() {
  return (window as any)?.electron?.ipcRenderer
}

export function installDesktopLyricBridge() {
  if (installed) return

  installed = true
  const currentInstallId = ++installId
  const isCurrentInstall = () => installed && currentInstallId === installId
  const controlAudio = ControlAudioStore()
  const globalPlayStatus = useGlobalPlayStatusStore()
  const { player } = storeToRefs(globalPlayStatus)
  const localUserStore = LocalUserDetailStore()
  const { userInfo } = storeToRefs(localUserStore)

  let lastIndex = -1
  let desktopLyricOpen = false
  let lastPlayState: boolean | undefined

  const getCurrentTimeMs = () => {
    const audio = controlAudio.Audio
    let milliseconds = Math.round((audio?.currentTime || 0) * 1000)
    if (milliseconds > 0) return milliseconds

    const currentSong = player.value.songInfo as any
    const lastSongId = userInfo.value?.lastPlaySongId
    const songId = currentSong?.songmid
    const restoredMilliseconds = Math.round(Number(userInfo.value?.currentTime || 0) * 1000)
    if (lastSongId && songId && lastSongId === songId && restoredMilliseconds > 0) {
      milliseconds = restoredMilliseconds
    }
    return milliseconds
  }

  const getLyricProgress = () => {
    const lines = (player.value.lyrics?.lines as LyricLine[]) || []
    const currentMs = getCurrentTimeMs()
    const index = computeLyricIndex(currentMs, lines)
    let progress = 0

    if (index >= 0 && lines[index]) {
      const line = lines[index]
      const duration = Math.max(1, (line.endTime ?? line.startTime + 1) - line.startTime)
      progress = Math.min(1, Math.max(0, (currentMs - line.startTime) / duration))
    }

    return { currentMs, index, progress, lines }
  }

  const sendProgress = (index: number, progress: number, currentMs: number) => {
    getIpcRenderer()?.send?.('play-lyric-progress', {
      index,
      progress,
      currentMs,
      timestamp: performance.now()
    })
  }

  const syncLyricProgress = (sendDesktopProgress: boolean) => {
    if (!isCurrentInstall()) return

    const { currentMs, index, progress } = getLyricProgress()
    if (sendDesktopProgress) sendProgress(index, progress, currentMs)

    if (index !== lastIndex) {
      lastIndex = index
      getIpcRenderer()?.send?.('play-lyric-index', index)
    }
  }

  const pushSnapshot = () => {
    if (!isCurrentInstall()) return

    try {
      const currentSong = player.value.songInfo as any
      const name = currentSong?.name || ''
      const artist = currentSong?.singer || ''
      if (name || artist) {
        getIpcRenderer()?.send?.('play-song-change', { name, artist })
      }

      const { currentMs, index, progress, lines } = getLyricProgress()
      getIpcRenderer()?.send?.('play-lyric-change', buildLyricPayload(lines))
      lastIndex = index
      getIpcRenderer()?.send?.('play-lyric-index', index)
      if (desktopLyricOpen) sendProgress(index, progress, currentMs)
      getIpcRenderer()?.send?.('play-status-change', !!controlAudio.Audio.isPlay)
    } catch {}
  }

  const scheduleUpdates = () => {
    clearUpdateTimer()
    if (!isCurrentInstall() || !controlAudio.Audio.isPlay) return

    const interval = desktopLyricOpen ? DESKTOP_LYRIC_SYNC_MS : MENU_BAR_LYRIC_SYNC_MS
    const update = () => {
      if (!isCurrentInstall() || !controlAudio.Audio.isPlay) {
        clearUpdateTimer()
        return
      }

      syncLyricProgress(desktopLyricOpen)
      updateTimer = window.setTimeout(
        update,
        desktopLyricOpen ? DESKTOP_LYRIC_SYNC_MS : MENU_BAR_LYRIC_SYNC_MS
      )
    }

    syncLyricProgress(desktopLyricOpen)
    updateTimer = window.setTimeout(update, interval)
  }

  const setDesktopLyricOpen = (open: boolean, shouldPushSnapshot = true) => {
    desktopLyricOpen = !!open
    if (desktopLyricOpen && shouldPushSnapshot) pushSnapshot()
    scheduleUpdates()
  }

  const addIpcListener = (channel: string, listener: (...args: any[]) => void) => {
    const ipcRenderer = getIpcRenderer()
    if (!ipcRenderer?.on) return

    ipcRenderer.on(channel, listener)
    ipcListeners.push({ channel, listener })
  }

  stopWatchers.push(
    watch(
      () => player.value.lyrics.lines,
      (lines) => {
        lastIndex = -1
        getIpcRenderer()?.send?.('play-lyric-change', buildLyricPayload(lines as LyricLine[]))
        getIpcRenderer()?.send?.('play-lyric-index', -1)
        scheduleUpdates()
      },
      { immediate: true }
    )
  )

  stopWatchers.push(
    watch(
      () => player.value.songInfo,
      (song) => {
        const name = (song as any)?.name || ''
        const artist = (song as any)?.singer || ''
        if (name || artist) getIpcRenderer()?.send?.('play-song-change', { name, artist })
      },
      { immediate: true }
    )
  )

  stopWatchers.push(
    watch(
      () => controlAudio.Audio.isPlay,
      (isPlaying) => {
        if (isPlaying !== lastPlayState) {
          lastPlayState = isPlaying
          getIpcRenderer()?.send?.('play-status-change', isPlaying)
        }
        if (!isPlaying) syncLyricProgress(desktopLyricOpen)
        scheduleUpdates()
      },
      { immediate: true }
    )
  )

  stopWatchers.push(
    controlAudio.subscribe('seeked', () => {
      syncLyricProgress(desktopLyricOpen)
      scheduleUpdates()
    })
  )

  addIpcListener('lyric-window-ready', () => {
    pushSnapshot()
    void Promise.resolve(getIpcRenderer()?.invoke?.('get-lyric-open-state'))
      .then((open) => {
        if (typeof open === 'boolean' && isCurrentInstall()) setDesktopLyricOpen(open)
      })
      .catch(() => {})
  })

  addIpcListener('desktop-lyric-open-change', (_event: unknown, open: boolean) => {
    setDesktopLyricOpen(open)
  })

  addIpcListener('closeDesktopLyric', () => {
    setDesktopLyricOpen(false, false)
  })

  pushSnapshot()
  void Promise.resolve(getIpcRenderer()?.invoke?.('get-lyric-open-state'))
    .then((open) => {
      if (typeof open === 'boolean' && isCurrentInstall()) setDesktopLyricOpen(open)
    })
    .catch(() => {})
}

export function uninstallDesktopLyricBridge() {
  if (!installed) return

  installed = false
  installId++
  clearUpdateTimer()

  stopWatchers.forEach((stop) => stop())
  stopWatchers = []

  const ipcRenderer = getIpcRenderer()
  ipcListeners.forEach(({ channel, listener }) => {
    ipcRenderer?.removeListener?.(channel, listener)
  })
  ipcListeners = []
}
