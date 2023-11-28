import { COLLECTION, mongo_delete, mongo_put } from '@/utils/query_api_method';
import { Input } from '@nextui-org/react';
import React from 'react';
import { FaTrash } from 'react-icons/fa';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from 'reactflow';

export default function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
    data
}: EdgeProps) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    async function set_label(label: string) {
        await mongo_put(COLLECTION.TRANSITION, {
            _id: id
        }, {
            condition: label
        }).then(data.reload)
    }

    async function delete_edge() {
        await mongo_delete(COLLECTION.TRANSITION, {
            _id: id
        }).then(data.reload)
    }

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        fontSize: 12,
                        // everything inside EdgeLabelRenderer has no pointer events by default
                        // if you have an interactive element, set pointer-events: all
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan"
                >
                    <Input className='py-1 px-2 text-center rounded-lg' type='text' initialValue={label as string} onBlur={e => { set_label(e.target.value) }} />
                    <div onClick={delete_edge} className='bg-[#FF0000] text-white absolute top-[10px] right-[15px] p-1 rounded-md'><FaTrash /></div>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}