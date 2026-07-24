import type { SongList } from '../../types/audio'
import { putSongFirst } from './queueOrder'

const song = (songmid: string, name: string): SongList => ({ songmid, name }) as SongList

describe('putSongFirst', () => {
  it('adds a new song at the beginning of the queue', () => {
    const first = song('first', 'First')
    const second = song('second', 'Second')
    const added = song('added', 'Added')
    const list = [first, second]

    putSongFirst(list, added)

    expect(list).toEqual([added, first, second])
  })

  it('replaces an existing song and moves it to the beginning', () => {
    const first = song('first', 'First')
    const oldSong = song('same', 'Old metadata')
    const last = song('last', 'Last')
    const refreshedSong = song('same', 'Fresh metadata')
    const list = [first, oldSong, last]

    putSongFirst(list, refreshedSong)

    expect(list).toEqual([refreshedSong, first, last])
  })
})
