function startFlower(user_or, c, a, r, p, change) {
  // c is userColor, a is alpha, r is userR, p is position
  // The variable change stores the rate of rotation and the y coordinate for noise later
  // organic is used to store the list of instances of Organic objects that we will create
  for (var i = 0; i < 99; i++){
    // organics.push(new Organic(r/2 + 1 * i, p[0], p[1], i * 1, i * random(90),
    //                           color(c[0] + i * 0.2, c[1] - i*0.2, c[2] + i * 0.2, a / 3)));
    user_or.push(new Organic(0.1 + 1 * i, p[0], p[1], i * 6.17, i * random(90),
                              color(random(c[0] - 18, c[0] + 18), random(c[1] - 18, c[1] + 18), random(c[2] - 18, c[2] + 18), a / 3)));
   }
}

function show_one_user(user_or, c, a, r, p, change) {
  for(var i = 0; i < user_or.length; i++){
    user_or[i].setRadius(r / 2 + 1 * i);
    user_or[i].setAlpha(a / 3);
    user_or[i].show(change);
  }
  return (change + 0.03);
}

function Organic(radius,xpos,ypos,roughness,angle,color) {

  this.radius = radius; // Radius of blob
  this.xpos = xpos; // x position of blob
  this.ypos = ypos; // y position of blob
  this.roughness = roughness; // Magnitude of how much the circle is distorted
  this.angle = angle; // How much to rotate the circle by
  this.color = color; // Color of the blob

  this.setRadius = function(radius){
    this.radius = radius;
  }

  this.setAlpha = function(alpha){
    this.alpha = alpha;
  }


  this.show = function(change){

    noStroke(); // No stroke for the circle
    fill(this.color); // Color to fill the blob

    push(); // We enclose things between push and pop so that all transformations within only affect items within
    translate(xpos, ypos); // Move to xpos, ypos
    rotate(this.angle + change); // Rotate by this.angle+change
    // scale(                                                                  );
    beginShape(); // Begin a shape based on the vertex points below
    // The lines below create our vertex points
    var off = 0;
    for (var i = 0; i < TWO_PI; i += 0.1) {
      var offset = map(noise(off, change), 0, 1, -this.roughness, this.roughness);
      var r = this.radius + offset;
      var x = r * cos(i);
      var y = r * sin(i);
      vertex(x, y);
      off += 0.1;
    }
    endShape(); // End and create the shape
    pop();
    }
}
