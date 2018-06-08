"use strict";

require("es6-promise").polyfill();
require("isomorphic-fetch");

const LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z"
];
// const LETTERS = [
//   "a",
//   "b",
//   "c",
//   "d",
//   "e",
//   "f",
//   "g",
//   "h",
//   "i",
//   "j",
//   "k",
//   "l",
//   "m",
//   "n",
//   "o",
//   "p",
//   "q",
//   "r",
//   "s",
//   "t",
//   "u",
//   "v",
//   "w",
//   "x",
//   "y",
//   "z"
// ];
// const LETTERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

const CANVAS_SIZE = {
  width: 49,
  height: 34
};
const NAMESPACE = "_____";

const fs = require("fs");
const fabric = require("fabric").fabric;
const path = require("path");
const FormData = require("form-data");
const delay = require("delay");
const pSeries = require("p-series");
const pAll = require("p-all");

const emoji_json = {
  title: "LETTERS",
  emojis: []
};

let emojis = [];
let jobs = [];

LETTERS.forEach((letter, index) => {
  let canvas = new fabric.StaticCanvas();
  canvas.setWidth(CANVAS_SIZE.width);
  canvas.setHeight(CANVAS_SIZE.height);
  let text = new fabric.Text(letter, {
    left: CANVAS_SIZE.width / 2.0,
    top: CANVAS_SIZE.height / 2.0 + (isLowerCase(letter) ? -0.0 : 2.0), //magic delta
    fill: "#000000",
    fontFamily: "PingFangSC-Semibold",
    fontSize: 32,
    originX: "center",
    originY: "center"
  });
  canvas.add(text);

  let img = canvas.toDataURL();
  let data = img.replace(/^data:image\/\w+;base64,/, "");
  let buf = new Buffer(data, "base64");
  console.log(letter);
  const fileName = `${letter}.png`;
  const dir = path.join(__dirname, "/dist/");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, buf);

  const imageFile = fs.createReadStream(filePath);

  let body = new FormData();
  body.append("smfile", imageFile);
  const uploadJob = delay(index * 5000, "").then(() => {
    return fetch("https://sm.ms/api/upload", {
      method: "POST",
      body: body
    })
      .then(response => response.json())
      .then(success => {
        console.log(success);
        emojis.push({
          name: `${NAMESPACE}_${letter}`,
          src: success.data.url
        });
      })
      .catch(error => console.log(error));
  });

  jobs.push(() => uploadJob);
});

pSeries(jobs).then(result => {
  emoji_json.emojis = emojis;
  const emoji_yaml = require("js-yaml").safeDump(emoji_json);
  fs.writeFileSync("./emojis.yaml", emoji_yaml);
  console.log("generate emoji yaml success");
  console.log(emoji_yaml);
});

console.log(JSON.stringify(emoji_json));

function isLowerCase(str) {
  return str.toUpperCase() != str;
}
