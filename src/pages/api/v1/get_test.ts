import wrap_api_function from "@/utils/wrap_api_function";
import { NextApiRequest, NextApiResponse } from "next";

async function execute(body: any, req: NextApiRequest, res: NextApiResponse) {
    res.send([{ id: 1, text: "Success" }])
}

export default wrap_api_function(execute);