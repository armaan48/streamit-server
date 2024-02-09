const fs = require("fs");
const path = require("path");
async function deleteLocal(directory) {
    fs.readdirSync(directory).forEach((file) => {
        const filePath = path.join(directory, file);
        console.log(filePath, Date.now() - fs.statSync(filePath).birthtime)
        if ( ( Date.now() - fs.statSync(filePath).birthtimeMs ) > 3600000 ) {
            fs.unlink(filePath ,()=>{});
        }
    });
}

async function uploadLocal(fileName,  data, socket , type) {
    const decodedData = Buffer.from(data, "base64");
    const filePath = path.join(__dirname , fileName);
    if (!fs.existsSync(filePath))
        fs.writeFileSync(filePath , '');
    fs.appendFileSync( filePath, decodedData);
    socket.emit(`give-${type}`);
}

module.exports = {deleteLocal , uploadLocal};