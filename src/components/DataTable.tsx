import { Directory, Text } from "@/pages/api/[collection]/schemas";
import { display_error, display_success } from "@/utils/notifications";
import { COLLECTION, mongo_delete } from "@/utils/query_api_method"
import { FaEye, FaTrash } from "react-icons/fa";
import Paginated from "./Paginated";
import useGet from "@/utils/hooks/useGet";
import Dialog from "./Dialog";
import { useState } from "react";
import { Loading } from "@nextui-org/react";

const Directory = ({ on_delete, _id, name, method, ...props }: Directory & { on_delete: Function }) => {

    const [is_open, set_is_open] = useState(false);
    const { data: texts, is_loading } = useGet<Text[]>(COLLECTION.TEXT, { directory: _id.toString() }, true, !is_open)

    async function delete_directory() {
        await mongo_delete(COLLECTION.DIRECTORY, {
            _id: _id.toString()
        })
            .then(() => {
                display_success("Directory deleted");
                on_delete();
            })
            .catch(display_error);
    }

    return <div className="my-5">
        <div className="inline-block w-[calc(100%-60px)] text-[12px]">{name}</div>
        <FaEye className="inline-block cursor-pointer align-top mr-2" onClick={() => set_is_open(true)} />
        <FaTrash className="inline-block cursor-pointer align-top" onClick={delete_directory} />
        <Dialog title="View Data" is_open={is_open} close={() => set_is_open(false)}>
            {
                is_loading ? <Loading /> : null
            }
            {
                texts?.map((text, index) => <div key={index} className="my-5">
                    <div className="text-black/50 ml-2 mt-1 font-bold mb-2 text-[1.2em]">{text.name}</div>
                    <div className="text-black/50 ml-2 mt-1">{text.content}</div>
                </div>)
            }
        </Dialog>
    </div>
}

export default function DataTable({ salesbot_id }: { salesbot_id: string }) {

    return <Paginated
        collection={COLLECTION.DIRECTORY}
        query={{ salesbot: salesbot_id }}
        render_elements={(directories, reload) => directories.map((directory, index) => (
            <Directory key={index} on_delete={reload} {...directory} />
        ))}
    />
}