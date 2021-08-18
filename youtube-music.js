const YoutubeMusicApi = require('youtube-music-api')
const path = require('path')
const fs = require('fs')
const ytdl = require('ytdl-core')
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath('./ffmpeg/bin/ffmpeg.exe')

module.exports.findSong = async (text) => {
    const api = new YoutubeMusicApi()
    await api.initalize()

    console.log(`[youtube-music] search "${text}"`)

    let result = await api.search(text, 'song')

    let { artist, name, videoId } = result.content[0]
    let song = {
        url: `https://music.youtube.com/watch?v=${videoId}`,
        artist: artist?.name ?? artist?.[0].name ?? '',
        name,
    }

    console.log(`[youtube-music] found "${song.url}"`)

    return song
}

function syncStdoutProgress(text, appendNewline = false) {
    process.stdout.cursorTo(0)
    process.stdout.clearLine(1)
    process.stdout.write(text)

    if (appendNewline) {
        process.stdout.write('\n')
    }
}

const getLength = async (link) => {
    const info = await ytdl.getInfo(link)
    return info.videoDetails.lengthSeconds
}

module.exports.download = (link, outputPath, outputFilename) => {
    return new Promise((resolve, reject) => {
        mp4OutputPath = path.join(outputPath, `${outputFilename}.mp4`)
        mp3OutputPath = path.join(outputPath, `${outputFilename}.mp3`)

        const track = ytdl(link, { filter: 'audioonly' })

        track.pipe(fs.createWriteStream(mp4OutputPath))

        track
            .on('progress', (chunkLength, downloaded, total) => {
                syncStdoutProgress(`[youtube-music] Downloading: ${((downloaded / total) * 100).toFixed(2)}% `)
            })
            .on('end', async () => {
                console.log('')
                try {
                    const lengthInSeconds = await getLength(link)
                    const conversionProc = ffmpeg(mp4OutputPath)
                    if (lengthInSeconds) conversionProc.withDuration(lengthInSeconds)

                    conversionProc
                        .on('progress', (info) => {
                            if (info?.percent)
                                syncStdoutProgress(`[youtube-music] Converting: ${info.percent.toFixed(2)}% `)
                        })
                        .on('end', () => {
                            console.log('')
                            fs.unlinkSync(mp4OutputPath)
                            resolve(outputFilename)
                        })
                        .save(mp3OutputPath)
                } catch (error) {
                    console.error(error)
                    reject(error)
                }
            })
            .on('error', (err) => {
                reject(err)
            })
    })
}
