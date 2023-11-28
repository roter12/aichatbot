import { useEffect, useState } from "react";
import { COLLECTION, mongo_get } from "../query_api_method";
import moment from "moment";

export default function useGet<T>(collection: COLLECTION, query: any, multiple: boolean, is_paused: boolean, { limit, offset, sort }: { limit?: number, offset?: number, sort?: any } = {}) {
    const [data, set_data] = useState<T | undefined>(undefined);
    const [reload_index, set_reload_index] = useState(0);
    const [is_loading, set_is_loading] = useState(false);
    const [is_finished, set_is_finished] = useState(false);

    function reload() {
        set_reload_index(prevIndex => prevIndex + 1);

    }

    function fetch_data() {
        set_is_finished(false);
        if (!is_paused) {
            set_is_loading(true);

            mongo_get(collection, query, { limit, offset, multiple, sort })
                .then(set_data)
                .finally(() => {
                    set_is_loading(false);
                    set_is_finished(true);
                });
        }
    }

    useEffect(fetch_data, [is_paused, reload_index])

    return { data, reload, is_loading, is_finished };
}