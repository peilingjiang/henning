// Open and connect output socket
let socket = io('/output');
// Keep track of users
let users = {};

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255);
  noStroke();

  // Receive message from server
  socket.on('message', function(message){
    // Get id and data from message
    let id = message.id;
    let data = message.data;

    // Update user's data
    if(id in users) {
      let user = users[id];
      user.speed = data.speed;
      user.pR = user.r;
      user.r = data.r;
      user.alpha = data.alpha;
    }
    // Or create a new user
    else {
      users[id] = {
        speed: data.speed,
        position: data.position,
        r: data.r,
        pR: data.r,
        color: data.color,
        alpha: data.alpha
      }
    }
  });

  // Remove disconnected users
  socket.on('disconnected', function(id){
    delete users[id];
  });
}

function draw() {
  // background will change to the color of
  background(255);

  for (let u in users) {
    // Get user's data
    let user = users[u];
    let c = user.color;
    push();
    fill(c[0], c[1], c[2], user.alpha);
    ellipse(user.position[0], user.position[1], user.r, user.r);
    pop();
  }
}
