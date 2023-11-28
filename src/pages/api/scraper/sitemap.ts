import { fetch_json_post } from "@/utils/fetch_json";
import { COLLECTION, mongo_post } from "@/utils/query_api_method";
import wrap_api_function from "@/utils/wrap_api_function";
import create_new_directory from "@/utils/create_new_directory";
import { XMLParser } from 'fast-xml-parser';

const BEARER_TOKEN = process.env.MR_SCRAPER_API_KEY as string;
const SCRAPER_ID = parseInt(process.env.MR_SCRAPER_SCRAPER_ID!);
const parser = new XMLParser({ ignoreAttributes: false });

async function scrape_urls(salesbot_id: string, sitemap_url: string, urls: string[]) {
    const CHUNK_SIZE = 100;
    const chunks = [];
    for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
        chunks.push(urls.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of chunks) {
        await scrape_urls_chunked(salesbot_id, sitemap_url, chunk);
    }
}

async function scrape_urls_chunked(salesbot_id: string, sitemap_url: string, urls: string[]) {

    const url = `https://mrscraper.com/api/scrapers/${SCRAPER_ID}/run`;
    const body = { urls };
    const result = await fetch_json_post(url, body, BEARER_TOKEN);
    if (!result.data) {
        console.log("Could not get result from mrscraper: ", result);
        throw new Error("Could not get result from mrscraper: " + JSON.stringify(result));
    }

    const mrscraper_run_id = result.data[0].scraping_run_id;

    const directory: string = await create_new_directory(salesbot_id, sitemap_url, "sitemap scrape")

    await mongo_post(COLLECTION.SCRAPE, [{
        directory,
        url: sitemap_url,
        is_completed: false,
        is_multi_url_scrape: true,
        is_initiated: true,
        mrscraper_scraper_id: SCRAPER_ID,
        mrscraper_run_id: mrscraper_run_id,
    }]);
}

async function extract_sitemaps_from_sitemap(content: string) {
    const jsonObj = parser.parse(content);
    const urls = [];

    if (jsonObj.sitemapindex && jsonObj.sitemapindex.sitemap) {
        for (let sitemap of jsonObj.sitemapindex.sitemap) {
            if (sitemap.loc) {
                urls.push(sitemap.loc);
            }
        }
    }
    return urls;
}

async function extract_urls_from_sitemap(content: string) {
    const jsonObj = parser.parse(content);
    const urls = [];

    if (jsonObj.urlset && jsonObj.urlset.url) {
        console.log(jsonObj.urlset.url)
        for (let url of jsonObj.urlset.url) {
            if (url.loc) {
                urls.push(url.loc);
            }
        }
    }
    return urls;
}

async function scrape_sitemap(sitemap_url: string, salesbot_id: string) {
    console.log("Scraping sitemap: ", sitemap_url)
    const sitemap = await fetch(sitemap_url)
        .then((response) => response.text());

    const urls = await extract_urls_from_sitemap(sitemap);
    if (urls.length > 0) {
        await scrape_urls(salesbot_id, sitemap_url, urls);
    }

    const sitemaps = await extract_sitemaps_from_sitemap(sitemap);
    for (const sitemap of sitemaps) {
        await scrape_sitemap(sitemap, salesbot_id);
    }
}

async function execute(body: any) {
    const salesbot_id = body.salesbot_id;
    const sitemap_url = body.url;
    await scrape_sitemap(sitemap_url, salesbot_id);
}

export default wrap_api_function(execute);