import { DateTime } from "luxon";

export function formatTimestamp(timestamp) {
    var date = DateTime.fromSeconds(Number(timestamp)).toFormat("LLL. dd yyyy");
    var time = DateTime.fromSeconds(Number(timestamp)).toFormat("ttt");
    return date + " " + time
}