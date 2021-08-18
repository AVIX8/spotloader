const puppeteer = require('puppeteer')

module.exports.getSongs = async (playlistURL) => {
    try {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        await page.setViewport({
            width: 1920,
            height: 1080,
        })
        page.on('console', (msg) => console.log('[PAGE]:', msg.text()))
        console.log(`[spotify-parser] playlistURL = ${playlistURL}`)
        await page.goto(playlistURL)
        await page.waitForSelector('div._OpqIZJH2IqpNqAS9iJ7', { timeout: 20000 })

        const elem = await page.$('div._OpqIZJH2IqpNqAS9iJ7')
        const boundingBox = await elem.boundingBox()
        const songH = boundingBox.height
        await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2)

        let songs = []
        for (let i = 0, prevLenght = -1; songs.length != prevLenght; ++i) {
            prevLenght = songs.length
            const tmp = await page.evaluate(() => {
                let elements = document.querySelectorAll('div.vB_gmMwzmB3GcEliiiys > div:nth-child(2) > div')
                let res = []
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i]
                    try {
                        const num = Number(element.querySelector('div.fJkxEQFqM6FYZFEZ_Kb7 > div > span').innerHTML)
                        const img = element.querySelector('div.WEV5RiSkBqYutbcdPRxN > img').src
                        const name = element.querySelector('div.WEV5RiSkBqYutbcdPRxN > div > div').innerHTML
                        const artist = element.querySelector('div.WEV5RiSkBqYutbcdPRxN > div > span > a').innerHTML
                        res.push({ num, img, name, artist })
                    } catch (error) {
                        console.log(JSON.stringify(error))
                    }
                }
                return res
            })

            tmp.forEach((song) => {
                if (songs[song.num - 1] == undefined) {
                    songs[song.num - 1] = song
                    console.log(`[spotify-parser] + ${song.num} - ${song.artist} - ${song.name}`)
                }
            })

            // await page.screenshot({ path: `imgs/${i}.png` })
            await page.mouse.wheel({ deltaY: songH * 40 })
            try {
                await page.waitForResponse(() => true, { timeout: 5000 })
            } catch {}
            await page.waitForTimeout(1000)
        }
        console.log(`[spotify-parser] ${songs.length} songs were found`)
        await browser.close()
        return songs
    } catch (error) {
        console.log(error)
    }
}
