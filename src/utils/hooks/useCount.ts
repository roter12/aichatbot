import { useEffect, useState } from "react";
import { COLLECTION, mongo_count } from "../query_api_method";

export default function useCount(collection: COLLECTION, query: any, is_paused: boolean) {
    const [data, set_data] = useState<number | undefined>(undefined);
    const [reload_index, set_reload_index] = useState(0);
    const reload = () => set_reload_index(reload_index + 1);
    const [is_loading, set_is_loading] = useState(false);

    function fetch_data() {
        if (!is_paused) {
            set_is_loading(true);
            mongo_count(collection, query)
                .then(set_data)
                .finally(() => set_is_loading(false));
        }
    }

    useEffect(fetch_data, [is_paused, reload_index]);

    return { data, reload, is_loading };
}
