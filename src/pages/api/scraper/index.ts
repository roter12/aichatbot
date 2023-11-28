
import wrap_api_function from "@/utils/wrap_api_function";
import { Scrape } from "../[collection]/schemas";
import { COLLECTION, mongo_post, mongo_put } from "@/utils/query_api_method";
import { get_db } from "@/utils/mongo";
import { fetch_json_get, fetch_json_post } from "@/utils/fetch_json";
import create_new_directory from "@/utils/create_new_directory";

const BEARER_TOKEN = process.env.MR_SCRAPER_API_KEY as string;

let db: any;

async function scrape_next() {
    const next_scrapes = await db.collection(COLLECTION.SCRAPE).find({ is_initiated: false, is_multi_url_scrape: false }).limit(10).toArray() as Scrape[];
    for (const next_scrape of next_scrapes) {
        const url = "https://mrscraper.com/api/scrapers/660/run";
        const body = {
            urls: [
                next_scrape.url
            ]
        };

        const result = await fetch_json_post(url, body, BEARER_TOKEN);
        const mrscraper_run_id = result.data[0].id;

        await mongo_put(COLLECTION.SCRAPE, { _id: next_scrape._id }, {
            is_initiated: true,
            mrscraper_run_id
        });
    }
}

function filter_links(links: string[], domain: string) {
    return (links.filter((link: string) => link !== null)
        .map((link: string) => {
            if (link.includes("#")) {
                return link.substring(0, link.indexOf("#"));
            } else {
                return link;
            }
        })
        .map((link: string) => {
            if (link.startsWith("/")) {
                return "https://" + domain + link;
            } else if (link.startsWith("http")) {
                return link;
            } else {
                return null;
            }
        })
        .filter((link: string | null) => link !== null) as string[])
        .filter((link: string) => {
            return link.startsWith("https://" + domain);
        })
        .map((link: string) => {
            if (!link.includes("?") && link.endsWith("/")) {
                return link.substring(0, link.length - 1);
            } else {
                return link;
            }
        })
        .filter((link: string) => {
            // exclude files like css, js, png, jpg, jpeg, ...
            const file_extensions = [
                "css",
                "js",
                "png",
                "jpg",
                "jpeg",
                "gif",
                "pdf",
                "doc",
                "docx",
            ]
            const file_extension = link.split(".").pop() || "";
            return !file_extensions.includes(file_extension);
        })
        .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
}

async function process_single_url_scrape(url: string, scrape: Scrape) {
    const result = await fetch_json_get(url, BEARER_TOKEN);
    if (!result.data) {
        console.log("Could not get result from mrscraper: ", result);
        return;
    }
    const json = result.data.content;
    if (!json) {
        return;
    }
    const content = json.text;
    const domain = scrape.url.split("/")[2];
    const links = filter_links(json.links, domain);

    await mongo_post(COLLECTION.TEXT, [{
        name: url,
        content,
        directory: scrape.directory,
        is_original: true,
        is_q_and_a: false,
        rewrites: 0
    }]);

    const existing_links = await db.collection(COLLECTION.SCRAPE).find({
        url: { $in: links }
    }).project({ url: 1 }).toArray();

    const existing_link_urls = existing_links.map(({ url }: { url: string }) => url);
    const new_links = links.filter((link: string) => !existing_link_urls.includes(link));

    if (new_links.length > 0) {
        await mongo_post(COLLECTION.SCRAPE, new_links.map((link: string) => ({
            directory: scrape.directory,
            url: link
        })));
    }

    await mongo_put(COLLECTION.SCRAPE, { _id: scrape._id }, {
        is_completed: true
    });
}

async function process_multi_url_scrape(start_index: number, scrape: Scrape) {
    const results = await fetch_scrapes(scrape.mrscraper_run_id!);
    const amount = 100;
    const results_in_range = results.slice(start_index, start_index + amount);
    const domain = scrape.url.split("/")[2];
    const directory = await db.collection(COLLECTION.DIRECTORY).findOne({ _id: scrape.directory });
    const salesbot_id = directory!.salesbot;
    await store_scrape_results(salesbot_id, domain, results_in_range);

    const next_index = start_index + amount;
    if (next_index < results.length) {
        await mongo_put(COLLECTION.SCRAPE, { _id: scrape._id }, {
            last_processed_index: next_index
        });
    } else {
        await mongo_put(COLLECTION.SCRAPE, { _id: scrape._id }, {
            is_completed: true
        });
    }
}

async function store_scrape_results(salesbot_id: string, domain: string, results: { content: any, scraped_url: string }[]) {
    const directory = await create_new_directory(salesbot_id, domain, "scraped");

    await mongo_post(COLLECTION.TEXT, results.map(result =>
        result.content ? ({
            name: result.scraped_url,
            content: result.content.text,
            directory: directory,
            is_original: true,
            is_q_and_a: false,
            rewrites: 0
        }) : null
    ).filter(result => result !== null));
}

async function fetch_scrapes(mrscraper_run_id: number) {
    const url = "https://mrscraper.com/api/scraping-runs/" + mrscraper_run_id;
    const json = await fetch_json_get(url, BEARER_TOKEN);
    // console.log(json.data.results[0]);
    // throw new Error("Not implemented")
    return json.data.results;
}

async function complete_next() {

    const scrapes_todo = await db.collection(COLLECTION.SCRAPE).find({ is_initiated: true, is_completed: false }).limit(10).toArray() as Scrape[];

    for (const scrape of scrapes_todo) {
        const url = "https://mrscraper.com/api/results/" + scrape.mrscraper_run_id;

        if (scrape.is_multi_url_scrape) {
            return await process_multi_url_scrape(scrape.last_processed_index || 0, scrape);
        } else {
            return await process_single_url_scrape(url, scrape);
        }
    }
}

async function execute() {
    db = await get_db();
    const result = await complete_next();
    await scrape_next();
    return result;
}

export default wrap_api_function(execute);