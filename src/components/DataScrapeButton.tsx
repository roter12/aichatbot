import create_new_directory from "@/utils/create_new_directory";
import { display_error, display_success } from "@/utils/notifications";
import query_api from "@/utils/query_api";
import { COLLECTION, mongo_post } from "@/utils/query_api_method";
import { Button, Input } from "@nextui-org/react";
import { useState } from "react";

export default function DataScrapeButton({ salesbot_id }: { salesbot_id: string }) {

    const [url, set_url] = useState("");

    async function scrape() {

        const is_sitemap = url.includes("sitemap")
            ? window.confirm("This looks like a sitemap. Should we treat it as a sitemap and scrape all the links in it?")
            : false

        if (is_sitemap) {
            query_api("scraper/sitemap", {
                salesbot_id,
                url
            })
                .then(() => { display_success("Scrape initialized. This will take a few minutes.") })
                .catch(display_error);
        } else {
            const directory = await create_new_directory(salesbot_id, url, "scraped");
            mongo_post(COLLECTION.SCRAPE, [{
                directory,
                url,
            }])
                .then(() => { display_success("Scrape initialized. This will take a few minutes.") })
                .catch(display_error);
        }
    }

    return <div>
        <Input value={url.replaceAll("https://", "")} placeholder="url" type="url" labelLeft="https://" onChange={e => set_url(
            ("https://" + e.target.value)
                .replaceAll("https://https://", "https://")
        )} />
        <Button style={{ minWidth: 0, width: "100px", display: "inline-block", marginLeft: "10px" }} onClick={scrape}>Scrape</Button>
    </div>
}