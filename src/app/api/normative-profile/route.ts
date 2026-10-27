import { getNormativeProfile } from "@/api/server/resources";
import { handle } from "@/api/server/route-handler";

export const GET = () => handle(getNormativeProfile);
