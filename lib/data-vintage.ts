import vintageJson from "@/lib/generated/data-vintage.json";

export const DATA_VINTAGE = vintageJson;
export const VINTAGE_LABEL = `${vintageJson.source}, fetched ${vintageJson.fetched_at}`;
export const VINTAGE_SHORT = vintageJson.source;
