// backend/processor.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

function generateThumbnail(inputPath, outputPath) {
  return sharp(inputPath)
    .resize(200, 200)
    .toFile(outputPath);
}

module.exports = { generateThumbnail };

const { dialog } = require('electron');

dialog.showOpenDialog({
    properties: ['openDirectory']
  }).then(result => {
    console.log(result.filePaths[0]);
  });
