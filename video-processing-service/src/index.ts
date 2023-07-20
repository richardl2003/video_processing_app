import express from "express"
import ffmpeg from 'fluent-ffmpeg'

const app = express()
app.use(express.json())

// Convert an input video to 360p 
app.post("/process-video", (req, res) => {
    const inputFilePath = req.body.inputFilePath;
    const outputFilePath = req.body.outputFilePath;

    // Error handling
    if (!inputFilePath) {
        res.status(400).send("Bad Reuqest: Missing input file path")
    }
    if (!outputFilePath) {
        res.status(400).send('Bad Request: Missing output file path')
    }

    ffmpeg(inputFilePath)
        .outputOptions("-vf", "scale=-1:360") // convert into 360p
        .on("end", () => {
            res.status(200).send("Video processing complete")
        })
        .on("error", (err) => {
            console.log(`An error occured: ${err.message}`);
            res.status(500).send(`Internal Server Error: ${err.message}`)
        })
        .save(outputFilePath)

})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Video processing service listening at http://localhost:${port}`)
})