const {
    bucketName,
    preset,
    trancoder_location,
    projectId,
    templateId,
    transcoder_location,
} = require("./credentials");

async function makeJob(socket, fileID, transcoderServiceClient) {
    console.log(transcoder_location  ,projectId , templateId , transcoder_location)
    const inputUri = `gs://${bucketName}${fileID}/${fileID}.mp4`;
    const outputUri = `gs://${bucketName}${fileID}/output/`;

    var request = [
        {
            parent: transcoderServiceClient.locationPath(
                projectId,
                transcoder_location
            ),
            job: {
                inputUri: inputUri,
                outputUri: outputUri,
                templateId: preset,
            },
        },
        {
            parent: transcoderServiceClient.locationPath(
                projectId,
                transcoder_location
            ),
            job: {
                inputUri: inputUri,
                outputUri: outputUri,
                templateId: templateId,
            },
        },
    ];

    // Run request
    transcoderServiceClient.createJob(request[0]);
    transcoderServiceClient.createJob(request[1]);
}

async function getJob(socket, jobid, transcoderServiceClient) {
    console.log("Trying", jobid);
    const request = {
        name: transcoderServiceClient.jobPath(
            projectId,
            trancoder_location,
            jobid
        ),
    };
    const [response] = await transcoderServiceClient.getJob(request);
    console.log(`job-state:`, response.state);
}

module.exports = { makeJob, getJob };
