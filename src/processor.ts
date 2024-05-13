import * as fs from "fs";
import sharp from 'sharp';

export function getContentAsJSON(contentDir:string) {
    return fs.readdirSync(contentDir).map((f) => {
      const data = fs.readFileSync(contentDir + f, "utf8");
      return JSON.parse(data);
    });
  }

export function getTitleURI (title:string) {
    return title.toLowerCase().replace(/ /g, "-").replace(/[^a-z-0-9]/g, "");
    }

export function getResizedPath (src:string, width:number, height:number) {
    const prefix = src.substring(0, src.lastIndexOf('.'));
    const suffix = src.substring(src.lastIndexOf('.'));
    return prefix + "-" + width + "-" + height + suffix;
  }
  
  
  export async function resizeImage(src:string, width:number, height:number){
    const resizedPath = getResizedPath(src, width, height);
    console.log(`Resizing ${src} to ${resizedPath}`);
    return sharp(src)
    .resize(width, height)
    .toFile(resizedPath);
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