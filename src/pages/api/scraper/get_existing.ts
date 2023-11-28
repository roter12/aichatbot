import create_new_directory from '@/utils/create_new_directory';
import { fetch_json_get, fetch_json_post } from '@/utils/fetch_json';
import { COLLECTION, mongo_post, mongo_put } from '@/utils/query_api_method';
import wrap_api_function from '@/utils/wrap_api_function';
import fs from "fs";

const BEARER_TOKEN = process.env.MR_SCRAPER_API_KEY as string;
const SCRAPES_FILE_PATH = "./scrapes.json";

async function fetch_scrapes() {
    const url = "https://mrscraper.com/api/scraping-runs";
    const json = await fetch_json_get(url, BEARER_TOKEN);
    const results = json.data[0].results;
    fs.writeFileSync(SCRAPES_FILE_PATH, JSON.stringify(results));
}

async function get_all_scrapes() {
    const content_string = fs.readFileSync(SCRAPES_FILE_PATH).toString();
    return JSON.parse(content_string);
}

async function store_scrape_results(scrape: { content: any, scraped_url: string }) {
    const content = scrape.content.content;
    const scraped_url = scrape.scraped_url;
    const salesbot_id = "6487f502c0a292d6eea57549";
    const directory = await create_new_directory(salesbot_id, scraped_url, "scraped");

    await mongo_post(COLLECTION.TEXT, [
        {
            content,
            directory: directory,
            is_original: true,
            is_q_and_a: false,
            rewrites: 0
        }
    ]);
}

async function execute(body: any) {
    const all_scrapes = await get_all_scrapes();
    const scrape = all_scrapes[body.scrape_index];
    await store_scrape_results(scrape);
}

export default wrap_api_function(execute);
