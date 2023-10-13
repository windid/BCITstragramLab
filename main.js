const path = require("path");

const IOhandler = require("./IOhandler");
const zipFilePath = path.join(__dirname, "myfile.zip");
const pathUnzipped = path.join(__dirname, "unzipped");
const pathProcessed = path.join(__dirname, "grayscaled");

const timeStart = Date.now();

IOhandler.unzip(zipFilePath, pathUnzipped)
  .then(() => IOhandler.readDir(pathUnzipped))
  .then((files) => {
    return Promise.all(
      files.map((file) => {
        const fileName = path.basename(file);
        const pathOut = path.join(pathProcessed, fileName);
        return IOhandler.grayScale(file, pathOut);
      })
    );
  })
  .then(() => {
    console.log("All done!");
    const timeEnd = Date.now();
    console.log(`Time elapsed: ${timeEnd - timeStart} ms`);
  })
  .catch((err) => console.log(err));