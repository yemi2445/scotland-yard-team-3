export { default as loadingGif } from "./images/loading.gif";

import { default as leeds_center_map } from "./images/leeds_center_map.png";
import { default as leeds_center_inverted_map } from "./images/leeds_center_inverted_map.png";
import { default as palm_city_map } from "./images/palm_city_map.png";

export interface StaticImageData {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
    blurWidth?: number;
    blurHeight?: number;
}

export const MAP_IMAGES: Record<string, StaticImageData> = {
    "leeds_center_map": leeds_center_map,
    "leeds_center_inverted_map": leeds_center_inverted_map,
    "palm_city_map": palm_city_map,
};