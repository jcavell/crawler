import * as fs from "fs";
import { default as axios } from "axios";
import sharp from 'sharp';

export async function downloadImage(url:string, filepath:string) {
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

export function getContentAsJSON(contentDir:string) {
    return fs.readdirSync(contentDir).map((f) => {
      const data = fs.readFileSync(contentDir + f, "utf8");
      return JSON.parse(data);
    });
  }

export function createImageNameFromTitle (title:string, imageURL:string) {
    const suffix = imageURL.substring(imageURL.lastIndexOf('.'));
    return title.toLowerCase().replace(/ /g, "-").replace(/\?/g, "") + suffix;
    }

export function getResizedPath (src:string, width:number, height:number) {
    const prefix = src.substring(0, src.lastIndexOf('.'));
    const suffix = src.substring(src.lastIndexOf('.'));
    return prefix + "_" + width + "_" + height + "_" + suffix;
  }
  
  
  export async function resizeImage(src:string, width:number, height:number){
    return sharp(src)
    .resize(width, height)
    .toFile(getResizedPath(src, width, height));
  }

  export function deleteFiles (dir: string) {
    const files = fs.readdirSync(dir);
  
    files.forEach((file) => {
      fs.rmSync(dir + file);
    });
    console.log("Deleted files from " + dir);
  };
  
  export async function copyToAstro(srcDir: string, destDir: string) {
    const files = fs.readdirSync(srcDir);
    files.forEach((file) => {
      fs.copyFileSync(srcDir + file, destDir + file);
    });
    console.log("Copied files to Astro from " + srcDir + " to " + destDir);
  };