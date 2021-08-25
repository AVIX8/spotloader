const spotify = require('./spotify')
const ytMusic = require('./youtube-music')
const sanitize = require('./sanitize')

spotify
    .getSongs(process.argv[2])
    .then(async (songs) => {
        for (let spotifySong of songs) {
            console.log('--------------------------------------------------------------------');
            let song = await ytMusic.findSong(`${spotifySong.artist} ${spotifySong.name}`)
            let filename = sanitize(`${song.artist} - ${song.name}`)
            
            await ytMusic.download(song.url, './songs', filename);
        }
    })

// ytMusic.findSong(`Nayer Suave (Kiss Me) (feat. Mohombi &amp; Pitbull)`).then(async (song) => {
//     let filename = sanitize(`${song.artist} - ${song.name}`)
//     console.log(filename)
//     await ytMusic.download(song.url, './songs', filename)
// })