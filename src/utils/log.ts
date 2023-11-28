import moment from "moment";

export default function log(message: string) {
    const time = moment().format("YYYY-MM-DD HH:mm:ss");
    console.log(`[${time}] ${message}`);
}