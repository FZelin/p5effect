const MAX_SPEED = 10;
const MAX_FORCE = 1.5;
const CIRCLE_RADIUS = 50;
const WIDTH = 600;
const HEIGHT = 600;
const CIRCLE_SIZE = WIDTH / 100; // Change this to WIDTH / 150 for more circles
const DARK_TRESHOLD = 10;
let circles = [];
let img;

function preload() {
  img = loadImage('/test.png');
}

function setup() {
  createCanvas(WIDTH, HEIGHT);
  pixelDensity(1);
  imageMode(CENTER);
  image(img, width / 2, height / 2);

  // Using underscore to flatten the array
  let matrix = getMatrixOfPixels();
  let newArrayOfAveragedPixels = _.flatten(getAverageMatrixValues(matrix, CIRCLE_SIZE));
}

function draw() {
  background(0);
  drawCircles();
}

function drawCircles() {
  circles.forEach(c => {
    c.applyBehaviors();
    c.update();
    c.draw();
  });
}

function getMatrixOfPixels() {
  // Load pixels into a pixels array (p5js functionality)
  loadPixels();

  // Group the pixel r,g,b,a values into arrays
  let groupPixels = [];
  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];
    let g = pixels[i + 1];
    let b = pixels[i + 2];
    let a = pixels[i + 3];
    groupPixels.push([r, g, b, a]);
  }

  // Create a matrix with the values
  let matrix = [];
  for (let i = 0; i < WIDTH; i++) {
    matrix[i] = [];
    for (let j = 0; j < HEIGHT; j++) {
      let index = i * WIDTH + j;
      matrix[i].push(groupPixels[index]);
    }
  }
  return matrix;
}

// Getting the average values of r,g,b,a into a new matrix
function getAverageMatrixValues(matrix, step) {
  const width = matrix.length;
  const height = matrix[0].length;
  let newMatrix = [];
  // Loop through the matrix, but with a step
  for (let i = 0; i < width; i += step) {
    for (let j = 0; j < height; j += step) {
      let totalValue = [0, 0, 0, 0];
      for (let x = 0; x < step; x++) {
        // Only create new array if it is undefined
        if (typeof newMatrix[i + x] === 'undefined') {
          newMatrix[i + x] = [];
        }
        for (let y = 0; y < step; y++) {
          // Add up all the values for r,g,b,a
          totalValue[0] += matrix[i + x][j + y][0];
          totalValue[1] += matrix[i + x][j + y][1];
          totalValue[2] += matrix[i + x][j + y][2];
          totalValue[3] += matrix[i + x][j + y][3];
        }
      }
      // Calculate the average of the r,g,b,a values
      let averageValueR = totalValue[0] / (step * step);
      let averageValueG = totalValue[1] / (step * step);
      let averageValueB = totalValue[2] / (step * step);
      let averageValueA = totalValue[3] / (step * step);
      let averageValue = [averageValueR, averageValueG, averageValueB, averageValueA];

      // Adding these values into the points array
      let x = j + step / 2;
      let y = i + step / 2 - 80;
      let color = averageValue;

      // Only add non-black circles
      if (!circleIsDarker(color)) {
        circles.push(new Vehicle(x, y, color));
      }

      for (let x = 0; x < step; x++) {
        for (let y = 0; y < step; y++) {
          newMatrix[i + x][j + y] = averageValue;
        }
      }
    }
  }
  return newMatrix;
}

function circleIsDarker(color) {
  return color[0] < DARK_TRESHOLD && color[1] < DARK_TRESHOLD && color[2] < DARK_TRESHOLD;
}

class Vehicle {
  constructor(x, y, color) {
    this.pos = createVector(random(width), random(height));
    this.target = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.acc = createVector();
    this.color = color;
  }

  update() {
    this.pos.add(this.vel);
    this.vel.add(this.acc);
    this.acc.mult(0);
  }

  draw() {
    stroke([...this.color]);
    strokeWeight(CIRCLE_SIZE);
	//rect(this.pos.x, this.pos.y, CIRCLE_SIZE, CIRCLE_SIZE);
	//fill([...this.color]);
    point(this.pos.x, this.pos.y);
  }

  arrive(target) {
    const desired = p5.Vector.sub(target, this.pos);
    const distance = desired.mag();
    let speed = MAX_SPEED;

    if (distance < CIRCLE_RADIUS) {
      speed = map(distance, 0, 100, 0, MAX_SPEED);
    }

    desired.setMag(speed);

    const steer = p5.Vector.sub(desired, this.vel);
    steer.limit(MAX_FORCE);

    return steer;
  }


  flee(target) {
    const desired = p5.Vector.sub(target, this.pos);
    const distance = desired.mag();

    if (distance < CIRCLE_RADIUS) {
      desired.setMag(MAX_SPEED);
      desired.mult(-1);

      const steer = p5.Vector.sub(desired, this.vel);
      steer.limit(MAX_FORCE);

      return steer;
    } else {
      return createVector(0, 0);
    }
  }

  applyForce(f) {
    this.acc.add(f);
  }

  applyBehaviors() {
    const arrive = this.arrive(this.target);
    const mouse = createVector(mouseX, mouseY);
    const flee = this.flee(mouse);

    arrive.mult(1);
    flee.mult(5);

    this.applyForce(arrive);
    this.applyForce(flee);
  }}
