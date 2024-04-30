import * as fs from "fs";
import { default as axios } from "axios";

const crawlerCardsDir = "./storage/datasets/kajabi/cards/";
const crawlerCheckoutsDir = "./storage/datasets/kajabi/checkouts/";
const crawlerImagesDir = "./storage/datasets/kajabi/images/";

const astroProjectRoot = "/Users/jonnycavell/dev/naomifisherpsychology/";
const astroCardsDir = astroProjectRoot + "src/content/courseCards/";
const astroCheckoutsDir = astroProjectRoot + "src/content/courseCheckouts/";
const astroImagesDir = astroProjectRoot + "public/images/courses/";

async function downloadImage(url, filepath) {
  console.log("Downloading " + url);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  return new Promise((resolve, reject) => {
    response.data
      .pipe(fs.createWriteStream(filepath))
      .on("error", reject)
      .once("close", () => resolve(filepath));
  });
}

const getAndDownloadImages = async () => {
  const files = fs.readdirSync(crawlerCardsDir);
  const promises = [];

  files.forEach((file) => {
    const data = fs.readFileSync(crawlerCardsDir + file, "utf8");
    const json = JSON.parse(data);
    const imageUrl = json["imageURL"];
    const imageName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);

    promises.push(downloadImage(imageUrl, crawlerImagesDir + imageName));
  });
  return Promise.all(promises);
};

const deleteFiles = (dir: string) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    fs.rmSync(dir + file);
  });
  console.log("Deleted files from " + dir);
};

const copyToAstro = async (srcDir: string, destDir: string) => {
  const files = fs.readdirSync(srcDir);
  files.forEach((file) => {
    fs.copyFileSync(srcDir + file, destDir + file);
  });
  console.log("Copied files to Astro from " + srcDir + " to " + destDir);
};

const run = async () => {
  // Delete old destination Astro files
  deleteFiles(astroCheckoutsDir);
  deleteFiles(astroCardsDir);
  deleteFiles(astroImagesDir);

  // Download Kajabi card images
  await getAndDownloadImages();

  // Copy card and checkout data and images to Astro
  copyToAstro(crawlerCardsDir, astroCardsDir);
  copyToAstro(crawlerCheckoutsDir, astroCheckoutsDir);
  copyToAstro(crawlerImagesDir, astroImagesDir);
};

run();
