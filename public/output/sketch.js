// Open and connect output socket
let socket = io('/output');
// Keep track of users
let users = {};

var currentMax = 0; //the radius of the biggest circle right now
var currentMaxId;
var bg = [255, 255, 255]; //background color array
var bgAlpha = 0; //background alpha value

function setup() {
  createCanvas(windowWidth, windowHeight);
  //background(255);
  noStroke();

  // Receive message from server
  socket.on('message', function(message){
    // Get id and data from message
    let id = message.id;
    let data = message.data;

    // Update user's data
    if(id in users) {
      let user = users[id];
      user.speed = data.speed; // For avgspeed
      user.r = data.r; // radius
      user.alpha = data.alpha; // alpha
      console.log(data.alpha);
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
  socket.on('disconnected', function(id){
    delete users[id];
  });


}

function draw() {
  push();
  fill(255);
  rect(0, 0, width, height);
  pop();
  // Background will change to the color of the current largest circle
  background(bg[0], bg[1], bg[2], bgAlpha);
  // console.log(bg[0], bg[1], bg[2], bgAlpha);
  currentMax = -1; // Reset the maximum value, r might == 0
  for (let u in users) {
    // Get user's data
    let user = users[u];
    let c = user.color;
    let a = user.alpha;
    let r = user.r;
    if (r > currentMax) {
      currentMax = r;
      currentMaxId = user.id;
      bg[0] = c[0];
      bg[1] = c[1];
      bg[2] = c[2];
      bgAlpha = a * 0.6; // The background is always more translucent than the circle

    }
  }

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
    if (users[u].id != currentMaxId) {
      push();
      // Draw all flowers in organics array
      user.change = show_one_user(user_or, c, a, r, new_p, user.change);
      pop();
    }
  }

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
    // let change = user.change;
    if (users[u].id === currentMaxId) {
      push();
      // Draw all flowers in organics array
      user.change = show_one_user(user_or, c, a, r, new_p, user.change);
      pop();
    }
  }
}
