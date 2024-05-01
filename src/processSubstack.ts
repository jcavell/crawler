import { copyToAstro, downloadImage, resizeImage, deleteFiles, createImageNameFromTitle, getContentAsJSON } from "./processor.js";

const crawlerArticlesDir = "./storage/datasets/substack/articles/";
const crawlerImagesDir = "./storage/datasets/substack/images/";

const astroProjectRoot = "/Users/jonnycavell/dev/naomifisherpsychology/";
const astroSubstackDir = astroProjectRoot + "src/content/blog/";
const astroImagesDir = astroProjectRoot + "public/images/blog/";

const getAndDownloadImages = async () => {
  const articles = getContentAsJSON(crawlerArticlesDir);
  const promises = [];

  articles.forEach((article) => {

    const images = article["images"] as string[];

    images.forEach((imageUrl, index:number) => {
      const imageName = createImageNameFromTitle(`${article["title"]}_${index}`, imageUrl);
      promises.push(downloadImage(imageUrl, crawlerImagesDir + imageName));
    });
  });

  return Promise.all(promises);
};

const resizeImages = async () => {
  const articles = getContentAsJSON(crawlerArticlesDir);
  const promises = [];

  articles.forEach((article) => {

    const images = article["images"] as string[];

    images.forEach((imageUrl, index:number) => {
      const imageName = createImageNameFromTitle(`${article["title"]}_${index}`, imageUrl);
      promises.push(resizeImage(crawlerImagesDir + imageName, 300, 200));
    });
  });

  return Promise.all(promises);
}


const run = async () => {
  // Delete old destination Astro files
  deleteFiles(astroSubstackDir);
  deleteFiles(astroImagesDir);

  // Download substack images then resize them
  await getAndDownloadImages();
  await resizeImages();

  // Copy card and checkout data and images to Astro
  copyToAstro(crawlerArticlesDir, astroSubstackDir);
  copyToAstro(crawlerImagesDir, astroImagesDir);
};

run();
