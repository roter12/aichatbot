import useCount from "@/utils/hooks/useCount";
import useGet from "@/utils/hooks/useGet";
import { COLLECTION } from "@/utils/query_api_method";
import { Loading, Pagination } from "@nextui-org/react";
import { useEffect, useState } from "react";


export default function Paginated({ elements_per_page = 5, collection, query, sort, render_elements }
    : { elements_per_page?: number, collection: COLLECTION, query: any, sort?: any, render_elements: (elements: any[], reload: Function) => any }) {

    const { data: count, reload: reload_count } = useCount(collection, query, false);

    const [page, set_page] = useState(1);

    const { data: elements, reload, is_finished } = useGet<any[]>(collection, query, true, false, {
        sort,
        limit: elements_per_page,
        offset: elements_per_page * (page - 1)
    });

    useEffect(reload, [page]);

    if (count === 0) {
        return <div className="text-gray-500">There&apos;s nothing here</div>
    }

    return (
        <div>

            <Pagination total={
                count ? Math.ceil(count / elements_per_page) : 1} initialPage={page} onChange={set_page} />
            <div className="mt-2 w-full h-[400px]">
                {
                    is_finished
                        ? render_elements(elements!, reload)
                        : <Loading className="mt-[180px] mx-auto block" />
                }
            </div>
        </div>
    )
}