import { display_error, display_success } from '@/utils/notifications';
import { COLLECTION, mongo_delete, mongo_put } from '@/utils/query_api_method';
import { Textarea } from '@nextui-org/react';
import { useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { Handle, Position } from 'reactflow';

function CustomNode({ data }: { data: any & { is_collapsed: boolean, reload: any } }) {
    const [prompt, set_prompt] = useState(data.prompt);
    const [storage, set_storage] = useState(data.storage);

    const [is_deleted, set_is_deleted] = useState(false);

    async function save() {
        await mongo_put(COLLECTION.STATE, {
            _id: data._id.toString(),
        }, {
            prompt,
            storage
        })
            .then(data.reload)
            .catch(display_error)
    }

    async function delete_state() {
        await mongo_delete(COLLECTION.STATE, { _id: data._id.toString() })
            .then(data.reload)
        set_is_deleted(true);
    }

    if (is_deleted) return <></>;

    return (
        <div className="bg-white shadow-xl rounded-xl p-5 relative">
            <div onClick={delete_state} className='bg-[#FF0000] text-[12px] text-white absolute top-[3px] right-[3px] p-1 rounded-md'><FaTrash /></div>
            <Handle style={{ width: "10px", height: "10px" }} type="target" position={Position.Top} isConnectable={true} />

            <Textarea
                style={{ height: data.is_collapsed ? "50px" : "100px" }}
                placeholder='Response prompt'
                initialValue={data.prompt}
                onChange={e => set_prompt(e.target.value)}
                onBlur={save}
            ></Textarea>
            {
                data.is_collapsed ? <></> : <>
                    <div className='h-[10px]'></div>
                    <Textarea
                        placeholder='Storage prompt'
                        initialValue={data.storage}
                        onChange={e => set_storage(e.target.value)}
                        onBlur={save}
                    ></Textarea>
                </>
            }
            <Handle style={{ width: "10px", height: "10px" }} type="source" position={Position.Bottom} id="b" isConnectable={true} />
        </div>
    );
}

export default CustomNode;
