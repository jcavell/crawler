import { copyToAstro, resizeImage, deleteFiles, getTitleURI, getContentAsJSON } from "./processor.js";
import * as fs from "fs";
import { default as axios } from "axios";
import mime from 'mime';

const crawlerCardsDir = "./storage/datasets/kajabi/cards/";
const crawlerCheckoutsDir = "./storage/datasets/kajabi/checkouts/";
const crawlerImagesDir = "./storage/datasets/kajabi/images/";

const astroProjectRoot = "/Users/jonnycavell/dev/naomifisherpsychology/";
const astroCardsDir = astroProjectRoot + "src/content/courseCards/";
const astroCheckoutsDir = astroProjectRoot + "src/content/courseCheckouts/";
const astroImagesDir = astroProjectRoot + "public/images/kajabi/";


export async function downloadKajabiImage(cardFileName:string) {

  console.log("Downloading image for card " + cardFileName);

  const cardData = fs.readFileSync(crawlerCardsDir + cardFileName, "utf8");
    const cardsJSON = JSON.parse(cardData);
    const url = cardsJSON["imageURL"];
    const titleURI = getTitleURI(cardsJSON["title"]);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {

    const imageExtension = mime.getExtension(response.headers['content-type']);
    const imageFileName = titleURI + '.' + imageExtension;
    const imageFilepath = crawlerImagesDir + imageFileName;

    // Write the data back
    cardsJSON['imageFileName'] = imageFileName;    
    fs.writeFileSync(crawlerCardsDir + cardFileName, JSON.stringify(cardsJSON, undefined, 4));

    console.log(`Saving image to ${imageFilepath}`);

    return response.data
      .pipe(fs.createWriteStream(imageFilepath))
      .on("error", reject)
      .once("close", () => resolve(imageFilepath));
  });
}

const getAndDownloadImages = async () => {
  const promises = [];

  fs.readdirSync(crawlerCardsDir).map((f) => {
    promises.push(downloadKajabiImage(f));
  });

  return Promise.all(promises);
};

const resizeImages = async () => {
  const cards = getContentAsJSON(crawlerCardsDir);
  const promises = [];

  cards.forEach((card) => {
    const imageFileName = card["imageFileName"];
    promises.push(resizeImage(crawlerImagesDir + imageFileName, 300, 200));
  });

  return Promise.all(promises);
}

 async function copyUniqueCardsToAstro(srcDir: string, destDir: string) {
  const files = fs.readdirSync(srcDir);
  const copied : { [key:string]:boolean; } = {};

  files.forEach((file) => {
    const data = JSON.parse(fs.readFileSync(srcDir + file, "utf8"));
    const checkoutUrl = data['checkoutUrl'];
    if(!copied[checkoutUrl]){  
      fs.copyFileSync(srcDir + file, destDir + file);
      copied[checkoutUrl] = true;
      console.log("Copied card " + file + " to Astro from " + srcDir + " to " + destDir);
    }
    else{
      console.log("***skipped card " + file + " because it's already been copied");

    }
  });
};


const run = async () => {
  // Delete old destination Astro files
  deleteFiles(astroCheckoutsDir);
  deleteFiles(astroCardsDir);
  deleteFiles(astroImagesDir);

  // Download Kajabi card images
  await getAndDownloadImages();
  // await resizeImages();

  // Copy card and checkout data and images to Astro
  copyUniqueCardsToAstro(crawlerCardsDir, astroCardsDir);
  copyToAstro(crawlerCheckoutsDir, astroCheckoutsDir);
  copyToAstro(crawlerImagesDir, astroImagesDir);
};

run();
