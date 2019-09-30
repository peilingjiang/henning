// Projetc Henning
// by Ruyi, Vince, Peiling
// 2019
// Collective Play F19

/*
Use poseNet() to track the position of EYEs.

Thanks to Mimi Yin for guidence and inspiration.
*/

// frameRate is 60
let debug = false;

// Open and connect input socket
let socket = io('/input');

let users = {};

let video;
let poseNet;
let poses = [];

let eyeDistance;
let pEyeDistance = -1; // init
let distanceNoise = 12; // Eliminate noise movements

// ---------- Speed range: [-120, 0] and [0, 120] ----------
let henSpeed = 0;
let henning = false; // if not henning, the user's node will fade

let restTime = 20; // 1/3 second, avoid fading during the interval of forwording and backwarding
let currentRestTime = 20;

let userPosition; // The center point of users, init in setup()
let userR = 22; // The radius of users node
let userColor; // An array!
let userAlpha = 255; // the alpha will fade to 0 if the user is not henning

let aveSpeed;

// Listen for confirmation of connection
socket.on('connect', function() {
  console.log("Connected");
});

function setup() {
  createCanvas(800, 800);
  background(255);
  // Each user will be assigned to some position in the center of canvas
  // as the starting point
  userPosition = [int(random(width * 0.2, width * 0.8)),
    int(random(height * 0.2, height * 0.8))];
  userColor = [random(50, 200), random(50, 200), random(50, 200)];

  video = createCapture(VIDEO);
  video.size(800, 600);

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on('pose', function(results) {
    poses = results;
  });

  // Hide the video element, and just show the canvas
  video.hide();

  noStroke();

  // Receive message from server
  socket.on('message', function(message) {
    // Get id and data from message
    let id = message.id;
    let data = message.data;

    // Update user's data
    if (id in users) {
      let user = users[id];
      // No need to update position and color
      user.speed = data.speed;
      user.pR = user.r;
      user.r = data.r;
      user.alpha = data.alpha;
    }
    // Or create a new user
    else {
      users[id] = {
        // speed: henSpeed,
        // position: userPosition,
        // r: userR,
        // color: userColor,
        // alpha: userAlpha
        id: message.id,
        speed: data.speed,
        position: data.position,
        r: data.r,
        pR: data.r, // Past radius, for lerp() if needed
        color: userColor,
        alpha: data.alpha
      }
    }
  });

  // Remove disconnected users
  socket.on('disconnected', function(id) {
    delete users[id];
  });
}

function modelReady() {
  console.log('Model Loaded');
}

function draw() {
  // Calculate eye distance
  cal_eye_distance();
  // Compute average speed
  compete_users_speed();
  // Update user node and emit
  update_user_node();
}

function cal_eye_distance() {
  // Update henning and henSpeed
  // Based on the change of eye distances
  if (poses.length > 0) {
    let pose = poses[0].pose;
    // Actual left eye point position
    var eyeL = pose['leftEye'];
    // Actual right eye point position
    var eyeR = pose['rightEye'];

    eyeDistance = sqrt((eyeL.x - eyeR.x) ** 2 + (eyeL.y - eyeR.y) ** 2);

    // init pEyeDistance
    if (pEyeDistance === -1) {
      pEyeDistance = eyeDistance;
    }

    // Has a valid pEyeDistance
    if (abs(eyeDistance - pEyeDistance) > distanceNoise) {
      // the user is henning
      henning = true;
      currentRestTime = 0;
      // henSpeed > 0 if forwarding
      // henSpeed < 0 if backwarding
      henSpeed = eyeDistance - pEyeDistance;
    } else {
      // the user is not henning
      currentRestTime += 1;
      henSpeed = 0; // henSpeed could == 0 when henning is true
      if (currentRestTime > restTime) {
        henning = false;
      } else {
        henning = true;
      }
    }
    if (debug) {
      console.log(henSpeed);
    }
  }
}

function compete_users_speed() {
  var total_speed = 0;
  if (users.length > 1) {
    // Only compete when more than 1 user
    for (let u in users) {
      let user = users[u];
      total_speed += abs(user.speed);
    }
    aveSpeed = total_speed / users.length;
  } else {
    aveSpeed = 0;
  }
  // console.log(aveSpeed);
}

function update_user_node() {
  if (henning) {
    if (henSpeed > 0) {
      userR += (henSpeed - aveSpeed) / 3; // Might need mapping
      userR = constrain(userR, 0, width * 2);
      // Restore alpha
      userAlpha += 1.5;
      userAlpha = constrain(userAlpha, 0, 255);
    } else if (henSpeed < 0) {
      userR += henSpeed / 6; // Breathing effect, might need mapping
    } else if (henSpeed === 0) {
      userR += -aveSpeed;
      userR = constrain(userR, 0, width * 2);
    }

  } else {
    // Not henning
    userR -= 10;
    userR = constrain(userR, 0, width * 2);
    userAlpha -= 1;
    userAlpha = constrain(userAlpha, 0, 255);

  }

  // ---------------------- EMIT ----------------------
  // Only emit data that can be directly used for drawing
  socket.emit('data', {
    speed: henSpeed,
    position: userPosition,
    r: userR,
    color: userColor,
    alpha: userAlpha
  });
}
