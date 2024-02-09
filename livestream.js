async function createInput(livestreamServiceClient , projectId , location ,inputId) {
  const request = {
    parent: livestreamServiceClient.locationPath(projectId, location),
    inputId: inputId,
    input: {
      type: 'RTMP_PUSH',
    },
  };
  const [operation] = await livestreamServiceClient.createInput(request);
  const response = await operation.promise();
  const [input] = response;
  console.log('input response' , input);
}


async function getInput() {
  // Construct request
  const request = {
    name: livestreamServiceClient.inputPath(projectId, location, inputId),
  };
  const [input] = await livestreamServiceClient.getInput(request);
  console.log('input',input);
}



async function listInputs() {
  const iterable = await livestreamServiceClient.listInputsAsync({
    parent: livestreamServiceClient.locationPath(projectId, location),
  });
  console.info('Inputs:');
  for await (const response of iterable) {
    console.log(response.name);
  }
}



async function deleteInput() {
  // Construct request
  const request = {
    name: livestreamServiceClient.inputPath(projectId, location, inputId),
  };

  // Run request
  const [operation] = await livestreamServiceClient.deleteInput(request);
  await operation.promise();
  console.log('Deleted input');
}