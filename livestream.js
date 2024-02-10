// input endpoints
async function createInput(
    livestreamServiceClient,
    projectId,
    livestream_location,
    inputId
) {
    const request = {
        parent: livestreamServiceClient.locationPath(projectId, livestream_location),
        inputId: inputId,
        input: {
            type: "RTMP_PUSH",
        },
    };
    const [operation] = await livestreamServiceClient.createInput(request);
    const response = await operation.promise();
    console.log(response)
    const [input] = response;
    console.log("input response", input);
}

async function getInput(livestreamServiceClient, projectId, livestream_location, inputId) {
    const request = {
        name: livestreamServiceClient.inputPath(projectId, livestream_location, inputId),
    };
    const [input] = await livestreamServiceClient.getInput(request);
    console.log("input", input);
}

async function listInputs(livestreamServiceClient , projectId , livestream_location ) {
    const iterable = await livestreamServiceClient.listInputsAsync({
        parent: livestreamServiceClient.locationPath(projectId, livestream_location),
    });
    console.info("Inputs:");
    for await (const response of iterable) {
        console.log(response.name);
    }
}

async function deleteInput(livestreamServiceClient , projectId , livestream_location ,inputId) {
    const request = {
        name: livestreamServiceClient.inputPath(projectId, livestream_location, inputId),
    };
    const [operation] = await livestreamServiceClient.deleteInput(request);
    await operation.promise();
    console.log("Deleted input");
}


// channel

async function createChannel(livestreamServiceClient , projectId , livestream_location , channelId , inputId , outputUri) {
  // Construct request
  console.log(outputUri)
  const request = {
      parent: livestreamServiceClient.locationPath(projectId, livestream_location),
      channelId: channelId,
      channel: {
          inputAttachments: [
              {
                  key: "my-input",
                  input: livestreamServiceClient.inputPath(
                      projectId,
                      livestream_location,
                      inputId
                  ),
              },
          ],
          output: {
              uri: outputUri,
          },
          elementaryStreams: [
              {
                  key: "es_video",
                  videoStream: {
                      h264: {
                          profile: "high",
                          heightPixels: 720,
                          widthPixels: 1280,
                          bitrateBps: 3000000,
                          frameRate: 30,
                      },
                  },
              },
              {
                  key: "es_audio",
                  audioStream: {
                      codec: "aac",
                      channelCount: 2,
                      bitrateBps: 160000,
                  },
              },
          ],
          muxStreams: [
              {
                  key: "mux_video",
                  elementaryStreams: ["es_video"],
                  segmentSettings: {
                      seconds: 2,
                  },
              },
              {
                  key: "mux_audio",
                  elementaryStreams: ["es_audio"],
                  segmentSettings: {
                      seconds: 2,
                  },
              },
          ],
          manifests: [
              {
                  fileName: "main.mpd",
                  type: "DASH",
                  muxStreams: ["mux_video", "mux_audio"],
                  maxSegmentCount: 5,
              },
          ],
      },
  };

  // Run request
  const [operation] = await livestreamServiceClient.createChannel(request);
  const response = await operation.promise();
  const [channel] = response;
  console.log("channel", channel);
}
async function getChannel(livestreamServiceClient , projectId , livestream_location , channelId) {
  // Construct request
  const request = {
      name: livestreamServiceClient.channelPath(
          projectId,
          livestream_location,
          channelId
      ),
  };
  const [channel] = await livestreamServiceClient.getChannel(request);
  console.log("Channel:", channel);
}

async function startChannel() {
  // Construct request
  const request = {
      name: livestreamServiceClient.channelPath(
          projectId,
          livestream_location,
          channelId
      ),
  };
  const [operation] = await livestreamServiceClient.startChannel(request);
  await operation.promise();
  console.log("Started channel");
}

async function stopChannel() {
  // Construct request
  const request = {
      name: livestreamServiceClient.channelPath(
          projectId,
          livestream_location,
          channelId
      ),
  };
  const [operation] = await livestreamServiceClient.stopChannel(request);
  await operation.promise();
  console.log("Stopped channel");
}
async function deleteChannel() {
  // Construct request
  const request = {
      name: livestreamServiceClient.channelPath(
          projectId,
          livestream_location,
          channelId
      ),
  };

  // Run request
  const [operation] = await livestreamServiceClient.deleteChannel(request);
  await operation.promise();
  console.log("Deleted channel");
}



module.exports = {
  createInput,
  getInput,
  listInputs,
  deleteInput,
  createChannel,
  getChannel,
  startChannel,
  stopChannel,
  deleteChannel
}