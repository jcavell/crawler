import { copyToAstro, resizeImage, deleteFiles, getTitleURI, getContentAsJSON } from "./processor.js";
import * as fs from "fs";
import { default as axios } from "axios";
import mime from 'mime';
import 'source-map-support/register'

const crawlerArticlesDir = "./storage/datasets/substack/articles/";
const crawlerBlogImagesDir = "./storage/datasets/substack/images/";

const astroProjectRoot = "/Users/jonnycavell/dev/naomifisherpsychology/";
const astroArticlesDir = astroProjectRoot + "src/content/blog/";
const astroBlogImagesDir = astroProjectRoot + "public/images/blog/";


export async function downloadSubstackImage(articleFileName:string) {

  console.log("Downloading image for article " + articleFileName);

  const articleData = fs.readFileSync(crawlerArticlesDir + articleFileName, "utf8");
    const articleJSON = JSON.parse(articleData);
    const images = articleJSON["images"];

    // Don't bother processing if there is no image
    if(images.length == 0) return;

    // Just use the first image
    const url = articleJSON["images"][0];

    const titleURI = getTitleURI(articleJSON["title"]);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {

    const imageExtension = mime.getExtension(response.headers['content-type']);
    const imageFileName = titleURI + '.' + imageExtension;
    const imageFilepath = crawlerBlogImagesDir + imageFileName;

    // Write the data back
    articleJSON['imageFileName'] = imageFileName;    
    fs.writeFileSync(crawlerArticlesDir + articleFileName, JSON.stringify(articleJSON, undefined, 4));

    console.log(`Getting image from ${url} and saving to ${imageFilepath}`);

    return response.data
      .pipe(fs.createWriteStream(imageFilepath))
      .on("error", reject)
      .once("close", () => resolve(imageFilepath));
  });
}
const getAndDownloadImages = async () => {
  const promises = [];

  fs.readdirSync(crawlerArticlesDir).map((f) => {
    promises.push(downloadSubstackImage(f));
  });

  return Promise.all(promises);
};


const resizeImages = async () => {
  const articles = getContentAsJSON(crawlerArticlesDir);
  const promises = [];

  articles.forEach((article) => {
    const imageFileName = article["imageFileName"];

    // Only resize if there is an image
    if(imageFileName) promises.push(resizeImage(crawlerBlogImagesDir + imageFileName, 300, 200));
  });

  return Promise.all(promises);
}


const run = async () => {
  // Delete old destination Astro files
  deleteFiles(astroArticlesDir);
  deleteFiles(astroBlogImagesDir);

  // Download substack images then resize them
  await getAndDownloadImages();
  await resizeImages();

  // Copy card and checkout data and images to Astro
  copyToAstro(crawlerArticlesDir, astroArticlesDir);
  copyToAstro(crawlerBlogImagesDir, astroBlogImagesDir);
};

run();
