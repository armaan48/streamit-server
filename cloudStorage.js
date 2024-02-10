const fs  = require("fs");
const path = require("path");


async function uploadStorage(socket , fileID , type, storage ,bucketName  ){
    console.log(`trying  ${fileID} ${type}`)
    var fileName = fileID;
    if (type == "video"){
        fileName += ".mp4";
    }else{
        fileName += ".png";     
    }
    const bucket = storage.bucket(bucketName);
    const filePath = path.join(__dirname , `/${type}/${fileName}`);
    await bucket.file(fileID + "/").save("");

    await bucket.upload( filePath, {
        destination: `${fileID}/${fileName}`,
    });
    console.log(`${fileName} uploaded to ${bucketName}`);
    await bucket.file(fileID + "/output/").save("");
    socket.emit("file-uploaded" , "nothing");
    fs.unlink(filePath,()=>{});
}


async function uploadDp(username ,storage , bucketName){
    const bucket = storage.bucket(bucketName);
    const filePath = path.join(__dirname , `/dp/${username}.png`)
    await bucket.upload(filePath , {
        destination: `${username}.png`,
    })
    fs.unlink(filePath , ()=>{})
}


module.exports = {uploadStorage , uploadDp}





