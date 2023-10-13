const unzipper = require('unzipper');
const fs = require('fs');
const PNG = require('pngjs').PNG;
const path = require('path');

// This implementation is trying to reduce IO ops by skipping the step of writing the unzipped files to disk.
// Instead, I pipe the unzipped files directly to the grayscale function.

const grayScale = (entry, pathOut) => {
  return new Promise((resolve, reject) => {
    entry
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

const promises = [];

fs.createReadStream('./myfile.zip')
  .pipe(unzipper.Parse()).on('entry', (entry) => {
    const fileName = entry.path;
    if (path.dirname(fileName) === '.' && path.extname(fileName) === '.png') {
      console.log('Processing:', fileName);
      promises.push(grayScale(entry, path.join('./grayscaled', fileName)))
    } else {
      entry.autodrain();
    }
  }).on('finish', () => {
    console.log('Unzipped')
    Promise.all(promises)
      .then(() => console.log('All done!'))
      .catch((err) => console.log(err));
  })
  .on('error', (err) => console.log(err));
