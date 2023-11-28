import React, { useCallback, useEffect, useState } from 'react';
import {
    addEdge,
    useNodesState,
    useEdgesState,
    Background,
    BackgroundVariant,
    Panel,
} from 'reactflow';
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import { COLLECTION, mongo_delete, mongo_post, mongo_put } from '@/utils/query_api_method';
import { AiOutlineFullscreenExit, AiOutlineFullscreen } from 'react-icons/ai';
import { VscExpandAll, VscCollapseAll } from 'react-icons/vsc';
import CustomEdge from './CustomEdge';

function hash(string) {
    var hash = 0;
    if (string.length == 0) {
        return hash;
    }
    for (var i = 0; i < string.length; i++) {
        var char = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

const nodeTypes = { custom_node: CustomNode };
const edgeTypes = { custom_edge: CustomEdge };

const onInit = (reactFlowInstance) => {};

const StateDiagram = ({ states, transitions, reload }) => {

    const [is_collapsed_view, set_is_collapsed_view] = useState(true);
    const [is_fullscreen, set_is_fullscreen] = useState(false);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const onConnect = useCallback(async (params) => {
        const condition = prompt("What condition should be applied for the transition?")
        await mongo_post(COLLECTION.TRANSITION, [{
            state_from: params.source,
            state_to: params.target,
            condition: condition
        }]).then(reload);
        setEdges((eds) => addEdge({ label: condition, animated: true, ...params }, eds));
    }, []);

    useEffect(() => {
        const nodes = states.map((state, index) => (
            {
                id: state._id.toString(),
                data: {
                    is_collapsed: is_collapsed_view,
                    ...state,
                    reload
                },
                type: 'custom_node',
                position: state.position || { x: 250, y: index * (is_collapsed_view ? 200 : 400) },
            }
        ))

        setNodes(nodes);
    }, [states, is_collapsed_view])

    useEffect(() => {
        const edges = transitions.map((transition, index) => (
            {
                id: transition._id.toString(),
                data: {
                    is_collapsed: is_collapsed_view,
                    ...transition,
                    reload
                },
                type: 'custom_edge',
                source: transition.state_from.toString(),
                target: transition.state_to.toString(),
                label: transition.condition,
                animated: true,
                style: { stroke: '#FFF', strokeWidth: 2 },
            }
        ))

        setEdges(edges);
    }, [transitions, is_collapsed_view])

    // we are using a bit of a shortcut here to adjust the edge type
    // this could also be done with a custom edge for example
    const edgesWithUpdatedTypes = edges.map((edge) => {
        if (edge.sourceHandle) {
            // const edgeType = nodes.find((node) => node.type === 'custom').data.selects[edge.sourceHandle];
            // edge.type = edgeType;
        }

        return edge;
    });

    function on_select(event) {
        const { nodes, edges } = event;
        if (nodes.length > 0) {
            // console.log("Node" + nodes[0].id)
        }
        if (edges.length > 0) {
            // console.log("Edge" + edges[0].id)
        }
    }

    async function onNodesDelete(nodes) {
        const ids = nodes.map(({ id }) => id);
        await mongo_delete(COLLECTION.STATE, {
            _id: {
                $in: ids
            }
        });
    }

    async function onEdgesDelete(edges) {
        const ids = edges.map(({ id }) => id);
        await mongo_delete(COLLECTION.TRANSITION, {
            _id: {
                $in: ids
            }
        });
    }

    async function save_state_position(id, position) {
        await mongo_put(COLLECTION.STATE, {
            _id: id
        }, {
            position
        })
    }

    return (
        <div className={`bg-black/5 rounded-md border ${is_fullscreen ? "fixed top-0 left-0 right-0 bottom-0 z-[777] bg-white" : "relative w-[400px] h-[500px]"} `}>
            <div onClick={() => set_is_collapsed_view(!is_collapsed_view)} className='absolute top-0 right-[30px] bg-black/70 w-[30px] h-[30px] text-[30px] cursor-pointer text-white z-[99999]'>
                {
                    is_collapsed_view ? <VscExpandAll /> : <VscCollapseAll />
                }
            </div>
            <div onClick={() => set_is_fullscreen(!is_fullscreen)} className='absolute top-0 right-0 bg-black/70 w-[30px] h-[30px] text-[30px] cursor-pointer text-white z-[99999]'>
                {
                    is_fullscreen ? <AiOutlineFullscreenExit /> : <AiOutlineFullscreen />
                }
            </div>

            <ReactFlow
                key={"diagram_" + (is_fullscreen ? "fullscreen" : "normal") + "_" + (hash(JSON.stringify(nodes.map(node => {
                    ({
                        ...node,
                        position: undefined
                    })
                }))) + hash(JSON.stringify(edges)))}
                onNodeDragStop={(event, node) => save_state_position(node.id, node.position)}
                style={{ backgroundColor: "#CCC" }}
                minZoom={0.2}
                maxZoom={1}
                nodes={nodes}
                edges={edgesWithUpdatedTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodesDelete={onNodesDelete}
                onEdgesDelete={onEdgesDelete}
                onInit={onInit}
                onSelectionChange={on_select}
                fitView
                attributionPosition="top-right"
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
            >
            </ReactFlow>
        </div>
    );
};

export default StateDiagram;
