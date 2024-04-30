import { PlaywrightCrawler, Dataset } from "crawlee";

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, request, enqueueLinks, parseWithCheerio }) => {
    const $ = await parseWithCheerio();

    await Dataset.open("kajabi/cards").then((d) => d.drop);
    await Dataset.open("kajabi/checkouts").then((d) => d.drop);

    const cardsDataset = await Dataset.open("kajabi/cards");
    const checkoutDataset = await Dataset.open("kajabi/checkouts");

    if (request.label === "CHECKOUT") {
      // CHECKOUT PAGE

      // Wait for the checkout to render
      await page.waitForSelector(".checkout-content");

      const url = request.url;
      const descriptions = $(".checkout-content")
        .find(".checkout-content-body p")
        .map(function (i, el) {
          return $(this).text();
        })
        .toArray();

      const testimonials = $("* div")
        .find(".checkout-testimonials-quote")
        .map(function (i, el) {
          return $(this).text();
        })
        .toArray();

      checkoutDataset.pushData({
        type: "CHECKOUT",
        url: url,
        descriptions: descriptions,
        testimonials: testimonials,
      });

      console.log("Checkout page");
    } else {
      // LANDING PAGE

      // Add the checkout links to the queue
      await enqueueLinks({
        selector: ".card",
        label: "CHECKOUT",
      });

      // Wait for the cards to render
      await page.waitForSelector(".card");

      const cards = $(".card")
        .map(function (i, el) {
          return {
            type: "CARD",
            categoryUrl: request.url,
            categoryPosition: i,
            title: $($(el).find(".card__title")[0]).text(),
            imageURL: $(el).find(".card__image")[0].attribs["src"],
            description: $($(el).find(".card__text")[0]).text(),
            price: $($(el).find(".card__price")[0]).text(),
            checkoutUrl:
              "https://courses.naomifisher.co.uk" + el.attribs["href"],
          };
        })
        .toArray();
      await cardsDataset.pushData(cards);
    }
  },
  maxRequestsPerCrawl: 200,
});

await crawler.run([
  "https://courses.naomifisher.co.uk",
  "https://courses.naomifisher.co.uk/low-demand-parenting",
]);
