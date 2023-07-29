// 1. Google Cloud Storage Layer 
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

const storage = new Storage();

const rawVideoBucketName = "test-yt-raw-videos"
const processedVideoBucketName = "test-yt-processed-videos"

const localRawVideoDir = "./raw-videos"
const localProcessedVideoDir = "./processed-videos"

/**
 * local directories for raw and processed videos
 */
export function setupDirectories() {
    ensureDirectoryExistance(localRawVideoDir)
    ensureDirectoryExistance(localProcessedVideoDir)
}

export function convertVideo(rawVideoName: string, processedVideoName: string) {
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoDir}/${rawVideoName}`)
        .outputOptions("-vf", "sacle=-1:360")
        .on("end", () => {
            console.log("Video conversion finished")
            resolve()
        })
        .on("erorr", (err) => {
            console.log("An error occured: ", err)
            reject(err)
        })
        .save(`${localProcessedVideoDir}/${processedVideoName}`)
    })
}

export async function downloadRawVideo(fileName:string) {
    // await blocks all other code from executing until asynchronous code is finished
    // need async keyword to use await
    await storage.bucket(rawVideoBucketName)
        .file(fileName)
        .download({ destination: `${localRawVideoDir}/${fileName}` })
    
    console.log(
        `gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoDir}/${fileName}`
    )
    
}

export async function uploadProcessedVideo(fileName: string) {
    const bucket = storage.bucket(processedVideoBucketName)

    await bucket.upload(`${localProcessedVideoDir}/${fileName}`, {
        destination: fileName
    })
    console.log(
        `${localProcessedVideoDir}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}}`
    );
    

    await bucket.file(fileName).makePublic()
}

function deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(`Failed to delete file ${filePath}: ${err.message}`);
                    reject(err)
                } else {
                    console.log(`File deleted at ${filePath}`);
                    resolve()
                    
                }
            })
            reject(`File ${filePath} does not exist`)
        } else {
            console.log(`File not found at ${filePath}, skipping the delete`);
            resolve()
            
        }
    })
}

export function deleteRawVideo(fileName: string) {
    return deleteFile(`${localRawVideoDir}/${fileName}`)
}

export function deleteProcessedVideo(fileName: string) {
    return deleteFile(`${localProcessedVideoDir}/${fileName}`)
}

export function ensureDirectoryExistance(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Directory created at ${dirPath}`);
        
    }
}
