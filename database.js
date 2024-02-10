async function signupProcess(socket, connectionDB, data) {
    const query = `SELECT * FROM user_details WHERE username='${data.username}'`;
    connectionDB.query(query, (err, res) => {
        if (err | (res.length == 0)) {
            console.log("success");
            socket.emit("passSignup", "success");
        } else {
            console.log("UserNameTaken");
            socket.emit("failSignUp", "UserNameTaken");
        }
    });
}
async function insertSignUpData(socket, connectionDB, data) {
    console.log(data);
    const query = `INSERT into user_details VALUES ?`;
    const values = [
        [
            data.username,
            data.channelName,
            data.channelDescription,
            data.publicKey,
            data.encryptedPrivateKey,
            data.encryptedPassword,
        ],
    ];

    await connectionDB.query(query, [values], (err, result) => {
        if (err) {
            console.log(err);
            socket.emit("failSignUp", "UserNameTaken");
        } else {
            console.log("values inserted\ngive-dp");
            socket.emit("give-dp", "success");
        }
    });
}

async function loginProcess(socket, connectionDB, data) {
    const query = `SELECT * FROM user_details WHERE username='${data.username}'`;
    connectionDB.query(query, (err, res) => {
        if (err | (res.length == 0)) {
            socket.emit("failLogin", "UserNameNotFound");
        } else {
            socket.emit("passLogin", JSON.parse(JSON.stringify(res))[0]);
        }
    });
}

async function getVideos(socket, connectionDB, data) {
    const query = "SELECT * FROM video_details";
    connectionDB.query(query, (err, res) => {
        if (err) {
            console.log("getVideos error");
        } else {
            socket.emit("send-videos", JSON.parse(JSON.stringify(res)));
        }
    });
}

async function insertVideoDetail(connectionDB, data , f) {
    const query = `INSERT into video_details VALUES ?`;
    let date = new Date();
    let creationTime = date.getTime()
    const values = [
        [
            data.id,
            data.author,
            data.title,
            data.tags,
            data.description,
            creationTime,
            0,
            0,
            0,
            f,
        ],
    ];
    console.log("trying to insert:", values[0]);
    await connectionDB.query(query, [values], (err, result) => {
        if (err) {
            console.log("video detail not inserted");
        } else {
            console.log("video detail inserted");
        }
    });
}

async function eventLike(socket, connectionDB, data, f) {
    if (f) {
        const query = `INSERT into like_details VALUES ?`;
        const values = [[data.video_id, data.user_id]];
        await connectionDB.query(query, [values], (err, result) => {
            if (!err) {
                console.log(`${data.user_id} liked ${data.video_id}`);
            }
        });
    } else {
        const query = `DELETE from like_details WHERE video_id = ? AND user_id = ?`;
        const values = [data.video_id, data.user_id];
        await connectionDB.query(query, values, (err, result) => {
            if (!err) {
                console.log(`${data.user_id} unliked ${data.video_id}`);
            }
        });
    }

    var query = "";
    if (f) query = "UPDATE video_details SET likes = likes + 1 WHERE id = ?";
    else query = "UPDATE video_details SET likes = likes - 1 WHERE id = ?";

    const values = [data.video_id];
    await connectionDB.query(query, values, (err, res) => {
        if (!err) {
            console.log(`updated ${data.video_id}'s like count`);
        }
    });
}

async function eventFollow(socket, connectionDB, data, f) {
    if (f) {
        const query = `INSERT into follow_details VALUES ?`;
        const values = [[data.follower_id, data.following_id]];
        await connectionDB.query(query, [values], (err, result) => {
            if (!err) {
                console.log(
                    `${data.follower_id} followed ${data.following_id}`
                );
            }
        });
    } else {
        const query = `DELETE from follow_details WHERE follower_id = ? AND following_id = ?`;
        const values = [data.follower_id, data.following_id];
        await connectionDB.query(query, values, (err, result) => {
            if (!err) {
                console.log(
                    `${data.follower_id} unfollowed ${data.following_id}`
                );
            }
        });
    }
}
async function likedVideoList(socket, connectionDB, username) {
    const query = `SELECT video_id from like_details where user_id = ?`;
    await connectionDB.query(query, [username], (err, res) => {
        if (!err) {
            socket.emit(
                "send-liked-video-list",
                JSON.parse(JSON.stringify(res))
            );
            console.log(
                `${username} liked video list::`,
                JSON.parse(JSON.stringify(res))
            );
        }
    });
}
async function followingVideoList(socket, connectionDB, username) {
    const query = `
    SELECT vd.*
    FROM video_details vd
    JOIN follow_details fd ON vd.author = fd.following_id
    WHERE fd.follower_id = ?
  `;
    connectionDB.query(query, [username], (error, res) => {
        if (error) {
            console.error("Error fetching videos:", error.message);
        } else {
            socket.emit(
                "send-following-video-list",
                JSON.parse(JSON.stringify(res))
            );
        }
    });
}
async function followingList(socket, connectionDB, username) {
    const query = `SELECT following_id from follow_details where follower_id = ?`;
    await connectionDB.query(query, [username], (err, res) => {
        if (!err) {
            socket.emit("send-following-list", JSON.parse(JSON.stringify(res)));
            console.log(
                `${username} following list::`,
                JSON.parse(JSON.stringify(res))
            );
        }
    });
}
async function updateWatchMins(connectionDB, data) {
    const query =
        "UPDATE video_details SET watch_mins = watch_mins + ? WHERE id = ?";
    const values = [data.watch_mins, data.video_id];
    connectionDB.query(query, values, (err, res) => {
        if (!err) {
            console.log(
                `watch mins updated ${data.video_id} by ${data.watch_mins}`
            );
        }
    });
}
async function incrementViews(connectionDB, video_id) {
    const query = "UPDATE video_details SET views = views + ? WHERE id = ?";
    const values = [1, video_id];
    connectionDB.query(query, values, (err, res) => {
        if (!err) {
            console.log(`views incremented ${video_id}`);
        }
    });
}

async function searchVideoList(socket, connectionDB, keyword) {
    const query = `SELECT * FROM video_details
                    WHERE MATCH(title, tags, description) AGAINST (?)`;
    const values = [keyword];
    connectionDB.query(query , values , (err , res)=>{
        if (!err){
            var videoList = JSON.parse(JSON.stringify(res));
            console.log(`${keyword} search result len ${videoList} `)
            socket.emit("send-search-video-list" , videoList)
        }else{
            console.log(err)
        }
    })
}

async function getEndpoint(socket , connectionDB , livestreamServiceClient ){

}

module.exports = {
    signupProcess,
    insertSignUpData,
    loginProcess,
    insertVideoDetail,
    getVideos,
    eventLike,
    eventFollow,
    likedVideoList,
    followingVideoList,
    followingList,
    updateWatchMins,
    incrementViews,
    searchVideoList
};
