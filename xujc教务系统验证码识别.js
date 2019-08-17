// ==UserScript==
// @name         嘉庚教务验证码识别
// @author       Maoxian
// @homepage     http://maoxian.fun/
// @namespace    http://tampermonkey.net/
// @match        http://jw.xujc.com/
// @description  嘉庚学院教务系统验证码识别，纯js+canvas实现，准确率95%。
// ==/UserScript==

(function() {
  "use strict";
  var img = document.getElementById("img");
  // img.setAttribute("onload", getCAPTCHA());
  img.addEventListener("click", getCAPTCHA);
  var div = document.createElement("div");
  div.style.backgroundColor = "#eee";
  var canvas = document.createElement("canvas");
  canvas.width = 60;
  canvas.height = 20;
  canvas.id = "canvas";
  canvas.style.width = "240px";
  canvas.style.height = "80px";
  div.appendChild(canvas);
  document.body.appendChild(div);
  getCAPTCHA();
})();

function getCAPTCHA() {
  setTimeout(function() {
      var image = document.querySelector("#img");
      var canvas = document.querySelector("#canvas");
      var ctx = canvas.getContext("2d");
      canvas.width = 60;
      canvas.height = 20;
      ctx.drawImage(image, 0, 0);
      var data = dealImg(ctx.getImageData(0, 0, canvas.width, canvas.height));
      ctx.putImageData(data, 0, 0);
      //document.body.appendChild(canvas);
  }, 100);
}

//处理
function dealImg(imgData) {
  binaryzation(imgData);
  searchCode(imgData);
  var code = getCode(imgData);
  var input =document.getElementById('imgcode');
  input.value=code;
  return imgData;
}

function isPixelWhite(imgData, i) {
  if (i < 0 || i >= imgData.width * imgData.height) {
      return true;
  }
  return (
      ((imgData.data[i * 4 + 0] == 255 && imgData.data[i * 4 + 1]) == 255 &&
       imgData.data[i * 4 + 2]) == 255
  );
}

function binaryzation(imgData) {
  //二值化 然而并不需要
  var r, g, b, gray;
  for (let i = 0; i < imgData.width * imgData.height; i++) {
      r = imgData.data[i * 4 + 0];
      g = imgData.data[i * 4 + 1];
      b = imgData.data[i * 4 + 2];
      gray = 0.299 * r + 0.587 * g + 0.114 * b <= 130 ? 0 : 255;
      imgData.data[i * 4 + 0] = gray;
      imgData.data[i * 4 + 1] = gray;
      imgData.data[i * 4 + 2] = gray;
  }
}

function searchCode(imgData) {
  //定义标记数组
  var arr = new Array(imgData.width * imgData.height);
  for (let i = 0; i < imgData.width * imgData.height; i++) {
      if (!isPixelWhite(imgData, i) && !arr[i]) {
          bfsSearch(imgData, i, arr);
      }
  }
}

//使用bfs遍历清除图片上的噪点
function bfsSearch(imgData, start, arr) {
  var queue = [start];
  var dels = [start];
  var dirs = [-1, -imgData.width, 1, imgData.width];
  var len = 0;

  while (queue.length != 0) {
      if (!isPixelWhite(imgData, next)) {
          len++;
      }
      var item = queue.shift();
      arr[item] = 1;
      for (var i = 0; i < dirs.length; i++) {
          var next = item + dirs[i];
          if (!isPixelWhite(imgData, next) && !arr[next]) {
              queue.push(next);
              dels.push(next);
          }
      }
  }

  if (len < 5) {
      for (let i of dels) {
          setColor(i,imgData,255,255,255);
      }
  } else {
      for (let i of dels) {
          setColor(i, imgData, 0, 255, 255);
      }
  }
}

function getCode(imgData) {
  var begin = 0;
  var num = 4; //共4个字符
  var ans = "";
  var x1, x2=0, y1, y2;
  while (num--) {
      var cnt = 0;
      //竖向
      for (var i = begin; i < imgData.width; i++) {
          var flag = false;
          for (var j = 0; j < imgData.height; j++) {
              if (!isPixelWhite(imgData, j * imgData.width + i)) {
                  flag = true;
              }
          }
          //如果这列有黑色
          if (cnt == 0 && flag) {
              x1 = i;
              cnt = 1;
          }
          if (cnt == 1 && !flag) {
              x2 = i - 1;
              break;
          }
      }
      //横向
      cnt = 0;
      for (i = 0; i < imgData.height; i++) {
          flag = false;
          for (j = x1; j < x2; j++) {
              if (!isPixelWhite(imgData, i * imgData.width + j)) {
                  flag = true;
              }
          }
          //如果这行有黑色
          if (cnt == 0 && flag) {
              y1 = i;
              cnt = 1;
          }
          if (cnt == 1 && !flag) {
              y2 = i - 1;
              break;
          }
      }

      //画框
      // for (i = y1; i <= y2; i++) {
      //   let x = i * imgData.width + x1;
      //   x = x < 0 ? 0 : x;
      //   setColor(x, imgData, 0, 255, 255);
      //   x = i * imgData.width + x2;
      //   setColor(x, imgData, 0, 255, 255);
      // }
      // for (i = x1; i <= x2; i++) {
      //   let y = y1 * imgData.width + i;
      //   setColor(y, imgData, 0, 255, 255);
      //   y = y2 * imgData.width + i;
      //   setColor(y, imgData, 0, 255, 255);
      // }

      //两点定位
      setColor(y1 * imgData.width + x1, imgData, 255, 0, 0);
      setColor(y2 * imgData.width + x2, imgData, 255, 0, 0);

      var s = "";
      for (i = y1; i <= y2; i++) {
          for (j = x1; j <= x2; j++) {
              s += +isPixelWhite(imgData, i * imgData.width + j);
          }
      }
      //console.log(s);
      ans += verfy1(s);

      // console.log(
      //   "p1(" + x1 + "," + y1 + ") p2(" + x2 + "," + y2 + ") begin:" + begin
      // );
      begin = x2 + 1;
  }
  console.log("结果:" + ans);
  //console.log("------------------------");
  return ans;
}

const scode = [
  /* A */ "11100111110000111001100100111100001111000011110000000000001111000011110000111100",
  /* B */ "00000011001110010011110000111001000000110011100100111100001111000011100100000011",
  /* C */ "11000001100111000011111000111111001111110011111100111111001111100001110011000001",
  /* D */ "00000011001110010011110000111100001111000011110000111100001111000011100100000011",
  /* E */ "0000000001111100111110011111000000100111110011111001111100111110000000",
  /* F */ "00000000001111110011111100111111000000110011111100111111001111110011111100111111",
  /* G */ "11000001100111000011111100111111001111110011000000111100001111001001110011000001",
  /* H */ "00111100001111000011110000111100000000000011110000111100001111000011110000111100",
  /* I */ "", //验证码字符中由于容易混淆没有该字符
  /* J */ "110000111100111100111100111100111100111100011100001001100011",
  /* K */ "00111100001110010011001100100111000011110000111100100111001100110011100100111100",
  /* L */ "0011111001111100111110011111001111100111110011111001111100111110000000",
  /* M */ "00111100000110000000000000100100001001000010010000111100001111000011110000111100",
  /* N */ "00111100000111000000110000001100001001000010010000110000001100000011100000111100",
  /* O */ "", //验证码字符中由于容易混淆没有该字符
  /* P */ "00000001001111000011110000111100000000010011111100111111001111110011111100111111",
  /* Q */ "", //验证码字符中由于容易混淆没有该字符
  /* R */ "00000001001111000011110000111100000000010000011100110011001110010011110000111100",
  /* S */ "10000001001111000011111100111111100000011111110011111100111111000011110010000001",
  /* T */ "00000000111001111110011111100111111001111110011111100111111001111110011111100111",
  /* U */ "00111100001111000011110000111100001111000011110000111100001111001001100111000011",
  /* V */ "00111100001111000011110010011001100110011001100111000011110000111110011111100111",
  /* W */ "00111100001111000011110000111100001001000010010000100100000000000001100000111100",
  /* X */ "00111100001111001001100111000011111001111110011111000011100110010011110000111100",
  /* Y */ "00111100001111001001100111000011111001111110011111100111111001111110011111100111",
  /* Z */ "0000000111110011111001111001111001111001111001111001111100111110000000"
];

const chs = [
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
function verfy1(str) {
  var ans,
      similar = 0;
  for (let i in scode) {
      let t = strSimilarity2Percent(scode[i], str);
      //console.log("比较字符:'" + chs[i] + "' 概率:" + t);
      if (t > similar) {
          similar = t;
          ans = chs[i];
      }
  }
  //console.log("猜测结果字符:" + ans + " 概率:" + similar);
  return ans;
}

function setColor(i, imgData, r, g, b) {
  imgData.data[i * 4 + 0] = r;
  imgData.data[i * 4 + 1] = g;
  imgData.data[i * 4 + 2] = b;
}

//两个字符串的相似程度，并返回相似度百分比
function strSimilarity2Percent(s, t) {
  var l = s.length > t.length ? s.length : t.length;
  var d = strSimilarity2Number(s, t);
  return 1 - d / l;
}

function strSimilarity2Number(s, t) {
  var n = s.length,
      m = t.length,
      d = [];
  var i, j, s_i, t_j, cost;
  if (n == 0) return m;
  if (m == 0) return n;
  for (i = 0; i <= n; i++) {
      d[i] = [];
      d[i][0] = i;
  }
  for (j = 0; j <= m; j++) {
      d[0][j] = j;
  }
  for (i = 1; i <= n; i++) {
      s_i = s.charAt(i - 1);
      for (j = 1; j <= m; j++) {
          t_j = t.charAt(j - 1);
          if (s_i == t_j) {
              cost = 0;
          } else {
              cost = 1;
          }
          d[i][j] = Minimum(
              d[i - 1][j] + 1,
              d[i][j - 1] + 1,
              d[i - 1][j - 1] + cost
          );
      }
  }
  return d[n][m];
}
function Minimum(a, b, c) {
  return a < b ? (a < c ? a : c) : b < c ? b : c;
}
