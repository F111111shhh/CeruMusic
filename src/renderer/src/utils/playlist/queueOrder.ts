import type { SongList } from '../../types/audio'

export function putSongFirst(list: SongList[], song: SongList): SongList[] {
  const existingIndex = list.findIndex((item) => item.songmid === song.songmid)
  if (existingIndex !== -1) list.splice(existingIndex, 1)
  list.unshift(song)
  return list
}
