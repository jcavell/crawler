import { PuppeteerCrawler, Dataset } from "crawlee";

const crawler = new PuppeteerCrawler({
  requestHandler: async ({
    page,
    request,
    enqueueLinks,
    parseWithCheerio,
    infiniteScroll,
  }) => {
    const url = request.url;

    //await Dataset.open("substack").then((d) => d.drop);
    const dataset = await Dataset.open("substack/articles");

    const existing = await dataset.map(async (item, index) => {
     return item['url'];
    });

    if (existing.includes(url)){
      console.log("IGNORING EXISTING ARTICLE " + url);
      return;
    }


    await infiniteScroll();
    const $ = await parseWithCheerio();


    if (request.label === "ARTICLE") {
      // ARTICLE PAGE

      // Wait for the article to render
      await page.waitForSelector(".single-post");


      const body = $(".body p, .body span").contents();

      const isWebinar =
        url === 'https://naomicfisher.substack.com/p/if-you-use-facebook-i-have-a-new' ||
        url === 'https://naomicfisher.substack.com/p/coming-soon' ||
        body.text().includes("Register here") ||
        body.text().includes("Get it here") ||
        body.text().includes("Book Here") ||
        body.text().includes("Book here") ||
        body.text().includes("half price") ||
        body.text().includes("Webinar") ||
        body.text().includes("webinar") ||
        body.text().includes("Sale") ||
        body.text().includes("sale") ||
        body.text().includes("Buy Here") ||
        body.text().includes("Buy here") ||
        body.text().includes("20%") ||
        body.text().includes("50%") ||
        body.text().includes("Register Now") ||
        body.text().includes("Register now") ||
        body.text().includes("Register Here") ||
        body.text().includes("Register here");

      if(isWebinar){
        console.log("IGNORING WEBINAR AD " + url);
      }
      else {
        const filteredBody = body.filter(function () {
          return (
            this.nodeType === 3 &&
            this.data.length > 1 &&
            !this.data.startsWith("Thanks for reading") &&
            !this.data.startsWith("Read here") &&
            !this.data.startsWith("Share") &&
            !this.data.startsWith("Subscribe")
          );
        });

        const paragraphs = filteredBody.toArray().map(function (el) {
          return el.data;
        });

        const re = /(\w{3}) (\d{2}), (\d{4})/;
        const headerText = $("div .post-header").text();
        const pubDate = re.exec(headerText);

        const title = $(".post-title").text();
        const subtitle = $(".subtitle").text();
        const images = $(".image-link")
          .toArray()
          .map(function (el) {
            return el.attribs.href;
          });

        
          dataset.pushData({
          url: url,
          pubDate: pubDate ? { day: pubDate[1], month: pubDate[2], year: pubDate[3] } : {},
          title: title,
          subtitle: subtitle,
          images: images,
          paragraphs: paragraphs,
        });

        console.log("Article: " + title);
      }
    } else {
      // ARCHIVE LISTING PAGE?

      // Add the ARTICLE links to the queue
      await enqueueLinks({
        globs: ["https://naomicfisher.substack.com/p/*"],
        label: "ARTICLE",
      });

      // Wait for the archive to render
      await page.waitForSelector(".portable-archive-list");

      const archive = $(".portable-archive-list");

      console.log(archive);
    }
  },
  maxRequestsPerCrawl: 200,
});

await crawler.run(["https://naomicfisher.substack.com/archive"]);
