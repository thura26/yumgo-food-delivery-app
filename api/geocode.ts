import { handleGeocode } from "../server/geocode";

export const config = { runtime: "edge" };

export default function handler(request: Request) {
  return handleGeocode(request);
}
