const unzipper = require('unzipper');
const fs = require('fs');
const PNG = require('pngjs').PNG;
const path = require('path');

// This implementation is trying to reduce IO ops by skipping the step of writing the unzipped files to disk.
// Instead, I pipe the unzipped files directly to the grayscale function.

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

// Approach A: wait all files unzipped before processing them, but more readable.

const approachA = (pathIn, pathOut) => {
  const unzip = (pathIn) => unzipper.Open.file(pathIn).then((d) => d.files);

  const filterFn = (file) => path.dirname(file.path) === '.' && path.extname(file.path) === '.png';

  const mapFn = (file) => grayScale(file.stream(), path.join(pathOut, file.path));

  unzip(pathIn)
    .then((files) => Promise.all(files.filter(filterFn).map(mapFn)))
    .then(() => console.log('All done!'))
    .catch((err) => console.log(err));
}

// Approach B: don't need to wait all files unzipped before processing them.

const approachB = (pathIn, pathOut) => {
  const promises = [];

  fs.createReadStream(pathIn)
    .pipe(unzipper.Parse()).on('entry', (entry) => {
      const fileName = entry.path;
      if (path.dirname(fileName) === '.' && path.extname(fileName) === '.png') {
        promises.push(grayScale(entry, path.join(pathOut, fileName)))
      } else {
        entry.autodrain();
      }
    }).on('finish', () => {
      Promise.all(promises)
        .then(() => console.log('All done!'))
        .catch((err) => console.log(err));
    })
    .on('error', (err) => console.log(err));
};


const approach = process.argv[2] === 'A' ? approachA : approachB
approach('./myfile.zip', './grayscaled')
