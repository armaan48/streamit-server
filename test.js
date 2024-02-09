// Imports the Transcoder library
const {TranscoderServiceClient} =
  require('@google-cloud/video-transcoder').v1;

const {projectId , location , templateId } = require("./credentials")


// Instantiates a client
const transcoderServiceClient = new TranscoderServiceClient();

async function createJobTemplate() {
  // Construct request
  const request = {
    parent: transcoderServiceClient.locationPath(projectId, location),
    jobTemplateId: templateId,
    jobTemplate: {
      config: {
        elementaryStreams: [
          {
            key: 'video-stream0',
            videoStream: {
              h264: {
                heightPixels: 480,
                widthPixels: 854,
                bitrateBps: 800000,
                frameRate: 30,
              },
            },
          },
          {
            key: 'video-stream1',
            videoStream: {
              h264: {
                heightPixels: 720,
                widthPixels: 1280,
                bitrateBps: 1500000,
                frameRate: 30,
              },
            },
          },
          {
            key: 'video-stream2',
            videoStream: {
              h264: {
                heightPixels: 1080,
                widthPixels: 1920,
                bitrateBps: 2500000,
                frameRate: 30,
              },
            },
          },
          {
            key: 'audio-stream0',
            audioStream: {
              codec: 'aac',
              bitrateBps: 64000,
            },
          },
        ],
        muxStreams: [
          {
            key: 'q1',
            container: 'mp4',
            elementaryStreams: ['video-stream0', 'audio-stream0'],
          },
          {
            key: 'q2',
            container: 'mp4',
            elementaryStreams: ['video-stream1', 'audio-stream0'],
          },
          {
            key: 'q3',
            container: 'mp4',
            elementaryStreams: ['video-stream2', 'audio-stream0'],
          },
        ],
      },
    },
  };

  // Run request
  const [jobTemplate] = await transcoderServiceClient.createJobTemplate(request);
  console.log(`Job template created: ${jobTemplate.name}`);
}

createJobTemplate();