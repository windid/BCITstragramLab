const unzipper = require('unzipper');
const fs = require('fs');
const PNG = require('pngjs').PNG;
const path = require('path');

// This implementation is trying to reduce IO ops by skipping the step of writing the unzipped files to disk.
// Instead, I pipe the unzipped files directly to the grayscale function.

const zipFilePath = path.join(__dirname, "myfile.zip");
const pathProcessed = path.join(__dirname, "grayscaled");

const grayScale = (fileStream, pathOut) => {
  return new Promise((resolve, reject) => {
    fileStream
      .pipe(new PNG({ filterType: 4 }))
      .on("parsed", function () {
        for (let i = 0; i < this.data.length; i += 4) {
          const avg = (this.data[i] + this.data[i + 1] + this.data[i + 2]) / 3;
          this.data[i] = this.data[i + 1] = this.data[i + 2] = avg;
        }
        this.pack().pipe(fs.createWriteStream(pathOut)).on('finish', () => {
          resolve();
          console.log('Processed:', pathOut);
        });
      })
      .on("error", (err) => reject(err));
  });
};

const timeStart = Date.now();

const filterFn = (file) => path.dirname(file.path) === '.' && path.extname(file.path) === '.png';

const mapFn = (file) => grayScale(file.stream(), path.join(pathProcessed, file.path));

unzipper.Open.file(zipFilePath)
  .then((d) => Promise.all(d.files.filter(filterFn).map(mapFn)))
  .then(() => {
    console.log('All done!');
    const timeEnd = Date.now();
    console.log(`Time elapsed: ${timeEnd - timeStart} ms`)
  })
  .catch((err) => console.log(err));
