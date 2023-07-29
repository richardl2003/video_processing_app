import express from "express"
import { convertVideo, deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setupDirectories, uploadProcessedVideo } from "./storage"

setupDirectories()

const app = express()
app.use(express.json())

// Convert an input video to 360p 
app.post("/process-video", async (req, res) => {
    let data;
    try {
        const message = Buffer.from(req.body.message.data, "base64").toString('utf-8')
        data = JSON.parse(message)
        if (!data.name) {
            throw new Error("No name provided")
        }
    } catch (err) {
        console.log(err);
        return res.status(400).send(`Bad Request: missing filename`)   
    }

    const inputFileName = data.name
    const outputFileName = `processed-${inputFileName}`

    await downloadRawVideo(inputFileName)

    try {
        await convertVideo(inputFileName, outputFileName)
    } catch (err) {
        Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ])
        console.log(err);
        return res.status(500).send(`Internal Server Error: video conversion failed`)
    }
    
    await uploadProcessedVideo(outputFileName)

    Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
    ])

    return res.status(200).send(`Processing finished successfully`)

}
)

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Video processing service listening at http://localhost:${port}`)
})