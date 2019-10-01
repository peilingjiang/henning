// Project Henning
// by Ruyi, Vince, Peiling
// 2019
// Collective Play F19

/*
Use poseNet() to track the position of EYEs.

Thanks to Mimi Yin for guidance and inspiration.
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
let distanceNoise = 30; // Eliminate noise movements

// ---------- Speed range: [-120, 0] and [0, 120] ----------
let henSpeed = 0;
let henning = false; // if not henning, the user's node will fade

let restTime = 5; // 5 miliseconds, avoid fading during the interval of forwarding and backwarding
let currentRestTime = 5;

let userPosition; // The center point of users, init in setup()
let userR = 22; // The radius of users node
let userColor; // An array!
let userAlpha = 22; // the alpha will fade to 0 if the user is not henning

let aveSpeed;

// Listen for confirmation of connection
socket.on('connect', function() {
  console.log("Connected");
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255);
  // Each user will be assigned to a random position in the center of canvas
  // as the starting point
  userPosition = [random(width * 0.2, width * 0.8),
    random(height * 0.2, height * 0.8)];
  userColor = [random(60, 185), random(60, 185), random(60, 185)];

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
      user.r = data.r;
      user.alpha = data.alpha;
    }
    // Or create a new user
    else {
      users[id] = {
        id: message.id,
        window_x: width,
        window_y: height,
        speed: data.speed,
        position: data.position,
        r: data.r,
        color: data.color,
        alpha: data.alpha,
        organics: [],
        change: 0
      }
      startFlower(users[id].organics, users[id].color, users[id].alpha, users[id].r, users[id].position, users[id].change);
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
  push();
  translate(width, 0);
  scale(-1, 1); // To flip the camera image
  if ((height / width) < 0.75) {
    // The window is too narrow and wide
    image(video, 0, 0, width, width * 3/4);
  } else if ((height / width) >= 0.75) {
    // The window is too tall, like a square
    image(video, 0, 0, height * 4/3, height);
  }
  filter(GRAY);
  pop();
  // Calculate eye distance
  cal_eye_distance();
  // Compute average speed
  compete_users_speed();
  // Update user node and emit
  update_user_node();

  // Draw user's own color
  push();
  for (let u in users) {
    if (socket.id === users[u].id) {
      let c = users[u].color;
      noFill();
      strokeWeight(36);
      stroke(c[0], c[1], c[2]);
      rect(0, 0, width, height);
    }
  }
  pop();

  // Draw other flowers
  for (let u in users) {
    // Get user's data
    let user = users[u];
    let c = user.color;
    let a = user.alpha;
    let r = user.r;
    let p_x = map(user.position[0], 0, user.window_x, 0, width);
    let p_y = map(user.position[1], 0, user.window_y, 0, height);
    let new_p = [p_x, p_y];
    let user_or = user.organics;
    if (users[u].id != socket.id) {
      push();
      // Draw all flowers in organics array
      user.change = show_one_user(user_or, c, a, r, new_p, user.change);
      pop();
    }
  }

  // Draw user's flower
  for (let u in users) {
    // Get user's data
    let user = users[u];
    let c = user.color;
    let a = user.alpha;
    let r = user.r;
    let user_or = user.organics;
    // let change = user.change;
    if (users[u].id === socket.id) {
      push();
      // Draw all flowers in organics array
      user.change = show_one_user(user_or, c, a, r, [width / 2, height / 2], user.change);
      pop();
    }
  }

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
      // The larger the flower is, the harder to get it bigger
      userR += 1 * ((henSpeed - aveSpeed) / (userR)**(1/3)); // Might need mapping
      // Restore alpha
      userAlpha += 3;
    } else if (henSpeed < 0) {
      userR += abs(henSpeed) - 10; // Breathing effect, might need mapping
    } else if (henSpeed === 0) {
      userR += -aveSpeed / 6;
    }

  } else {
    // Not henning
    userR -= 7.2;
    userAlpha -= 1;

  }
  userR = constrain(userR, 1, width * 2);
  userAlpha = constrain(userAlpha, 0, 200);
  console.log(userAlpha);

  // ---------------------- EMIT ----------------------
  // Only emit data that can be directly used for drawing
  socket.emit('data', {
    window_x: width,
    window_y: height,
    speed: henSpeed,
    position: userPosition,
    r: userR,
    color: userColor,
    alpha: userAlpha
  });
}
