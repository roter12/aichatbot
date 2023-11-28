import { useEffect, useState } from "react";
import { COLLECTION, mongo_get, mongo_post } from "../query_api_method";
import useGet from "./useGet";
import { display_error } from "../notifications";

export default function useGetOrCreate<T>(collection: COLLECTION, query: any, new_document: any, is_paused: boolean) {
    
    const get_result = useGet<T>(collection, query, false, is_paused);
    const { data, reload, is_loading, is_finished } = get_result;

    useEffect(() => {
        if (is_finished && data === null) {
            mongo_post(collection, [new_document])
                .then(reload)
                .catch(display_error);
        }
    }, [is_finished, is_loading])

    return get_result;
}

