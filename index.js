const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mysql = require("mysql");
const path = require("path");
const { deleteLocal, uploadLocal } = require("./localFileManager");
const { uploadStorage, uploadDp } = require("./cloudStorage");
const { makeJob, getJob } = require("./transcoder");
const {
    signupProcess,
    insertSignUpData,
    loginProcess,
    insertVideoDetail,
    getVideos,
    eventLike,
    eventFollow,
    likedVideoList,
    followingList,
    followingVideoList,
    updateWatchMins,
    incrementViews,
    searchVideoList,
} = require("./database");
const {
    projectId,
    transcoder_location,
    livestream_location,
    bucketName,
    user,
    password,
    database,
    hostip,
} = require("./credentials");

const {
    createInput,
    getInput,
    listInputs,
    deleteInput,
    createChannel,
    getChannel,
    startChannel,
    stopChannel,
    deleteChannel,
} = require("./livestream");

const fs = require("fs");
const { TranscoderServiceClient } =
    require("@google-cloud/video-transcoder").v1;
const { LivestreamServiceClient } = require("@google-cloud/livestream").v1;
const livestreamServiceClient = new LivestreamServiceClient();
const { Storage } = require("@google-cloud/storage");

const storage = new Storage({
    projectId: projectId,
});
const transcoderServiceClient = new TranscoderServiceClient();
const connectionDB = mysql.createConnection({
    host: hostip, // Cloud SQL instance IP (use 'localhost' for local development)
    user: user,
    password: password,
    database: database,
});

connectionDB.connect((err) => {
    if (err) {
        console.log("error connecting to sql");
    } else {
        console.log("connected to sql");
    }
});
const { v4 } = require("uuid");
var videoID = "nothing";
var liveStreamID = "nothing"

const app = express();
app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e12,
    pingTimeout: 60000,
    pingInterval: 3000,
    cors: {
        origin: "*",
    },
});

app.get("/", (req, res) => {
    res.send("sever is running");
});

server.listen(8080, async () => {
    deleteLocal(path.join(__dirname, "video"));
    deleteLocal(path.join(__dirname, "thumbnail"));
    deleteLocal(path.join(__dirname, "dp"));

    console.log("started ", 8080);
});
var userName;

io.on("connection", (socket) => {
    console.log("connected ", socket.id);

    socket.on("chat", (message) => {
        console.log(message);
    });

    // authentication
    socket.on("sign-up", async (data) => {
        userName = data.username;
        console.log("i got:", data);
        await signupProcess(socket, connectionDB, data);
    });
    socket.on("signup-complete", async (data) => {
        console.log(data);
        await insertSignUpData(socket, connectionDB, data);
    });

    socket.on("login", async (data) => {
        console.log("i got:", data.username);
        await loginProcess(socket, connectionDB, data);
    });

    // refresh
    socket.on("give-liked-video-list", (username) => {
        likedVideoList(socket, connectionDB, username);
    });
    socket.on("give-following-list", (username) => {
        followingList(socket, connectionDB, username);
    });
    socket.on("give-video-list", (query) => {
        getVideos(socket, connectionDB, query);
    });
    socket.on("give-following-video-list", (username) => {
        console.log("called");
        followingVideoList(socket, connectionDB, username);
    });
    socket.on("give-search-video-list", (keyword) => {
        searchVideoList(socket, connectionDB, keyword);
    });

    // video
    socket.on("send-video-details", (data) => {
        videoID = v4();
        data = { ...data, id: videoID };
        insertVideoDetail(connectionDB, data);
        console.log("asking for thumnail");
        socket.emit("give-video-thumbnail");
    });

    socket.on("send-video", (base64data) => {
        console.log("recieving video chunk");
        uploadLocal(`/video/${videoID}.mp4`, base64data, socket, "video");
    });
    socket.on("video-uploaded", async (data) => {
        console.log("file-uploaded successfully\n");
        socket.emit("file-uploaded", {});
        await uploadStorage(socket, videoID, "video", storage, bucketName);
        await uploadStorage(socket, videoID, "thumbnail", storage, bucketName);
        // await makeJob(socket  , videoID ,transcoderServiceClient);
    });

    // video-thumbnail
    socket.on("send-video-thumbnail", (base64data) => {
        console.log("recieving video-thumbnail chunk");
        uploadLocal(
            `/thumbnail/${videoID}.png`,
            base64data,
            socket,
            "video-thumbnail"
        );
    });
    socket.on("video-thumbnail-uploaded", (data) => {
        socket.emit("give-video");
    });



    // live
    socket.on("send-live-details" , async (data)=>{
        liveStreamID = v4();
        data = { ...data, id: liveStreamID };
        // const channelId = await getEndpoint();
        insertVideoDetail(connectionDB, data , 1);
        console.log("asking for thumbnail");
        socket.emit("give-live-thumbnail");
    })
    socket.on("send-live-thumbnail", (base64data) => {
        console.log("recieving live-thumbnail chunk");
        uploadLocal(
            `/thumbnail/${liveStreamID}.png`,
            base64data,
            socket,
            "live-thumbnail"
        );
    });
    socket.on("live-thumbnail-uploaded", (data) => {
        uploadStorage(socket ,liveStreamID , "thumbnail" , storage , "video-streamit");
    });

    // dp
    socket.on("send-dp", async (base64data) => {
        await uploadLocal(`/dp/${userName}.png`, base64data, socket, "dp");
    });
    socket.on("dp-uploaded", async (data) => {
        await uploadDp(userName, storage, "user-streamit/");
    });

    // like , unlike ,  follow unfollow
    socket.on("like", async (data) => {
        eventLike(socket, connectionDB, data, 1);
    });
    socket.on("unlike", async (data) => {
        eventLike(socket, connectionDB, data, 0);
    });
    socket.on("follow", async (data) => {
        eventFollow(socket, connectionDB, data, 1);
    });
    socket.on("unfollow", async (data) => {
        eventFollow(socket, connectionDB, data, 0);
    });
    socket.on("send-watch-mins", async (data) => {
        updateWatchMins(connectionDB, data);
    });
    socket.on("increment-views", async (video_id) => {
        incrementViews(connectionDB, video_id);
    });

    socket.on("disconnect", (reason, detail) => {
        console.log("disconnected", reason, detail);
    });
});

