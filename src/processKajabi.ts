import { copyToAstro, downloadImage, resizeImage, deleteFiles, createImageNameFromTitle, getContentAsJSON } from "./processor.js";

const crawlerCardsDir = "./storage/datasets/kajabi/cards/";
const crawlerCheckoutsDir = "./storage/datasets/kajabi/checkouts/";
const crawlerImagesDir = "./storage/datasets/kajabi/images/";

const astroProjectRoot = "/Users/jonnycavell/dev/naomifisherpsychology/";
const astroCardsDir = astroProjectRoot + "src/content/courseCards/";
const astroCheckoutsDir = astroProjectRoot + "src/content/courseCheckouts/";
const astroImagesDir = astroProjectRoot + "public/images/courses/";



const getAndDownloadImages = async () => {
  const cards = getContentAsJSON(crawlerCardsDir);
  const promises = [];

  cards.forEach((card) => {
    const imageUrl = card["imageURL"];
    const imageName = createImageNameFromTitle(card["title"], imageUrl);

    promises.push(downloadImage(imageUrl, crawlerImagesDir + imageName));
  });

  return Promise.all(promises);
};

const resizeImages = async () => {
  const cards = getContentAsJSON(crawlerCardsDir);
  const promises = [];

  cards.forEach((card) => {
    const imageName = createImageNameFromTitle(card["title"], card["imageURL"]);

    promises.push(resizeImage(crawlerImagesDir + imageName, 300, 200));
  });

  return Promise.all(promises);
}


const run = async () => {
  // Delete old destination Astro files
  deleteFiles(astroCheckoutsDir);
  deleteFiles(astroCardsDir);
  deleteFiles(astroImagesDir);

  // Download Kajabi card images then resize them
  await getAndDownloadImages();
  await resizeImages();

  // Copy card and checkout data and images to Astro
  copyToAstro(crawlerCardsDir, astroCardsDir);
  copyToAstro(crawlerCheckoutsDir, astroCheckoutsDir);
  copyToAstro(crawlerImagesDir, astroImagesDir);
};

run();
