import sharp from "sharp";
import { identify } from "../src/ai";
const blank = await sharp({create:{width:300,height:300,channels:3,background:"#f7f7ee"}}).jpeg().toBuffer();
const cases=[{name:"tree photograph",bytes:await Bun.file("../web/public/images/canopy.webp").bytes(),mimeType:"image/webp" as const,isPlant:true},{name:"blank image",bytes:blank,mimeType:"image/jpeg" as const,isPlant:false}];
let failed=false;
for(const sample of cases){const result=await identify({images:[{data:Buffer.from(sample.bytes).toString("base64"),mimeType:sample.mimeType}]});const passed=result.isPlant===sample.isPlant;console.log(JSON.stringify({case:sample.name,passed,commonName:result.commonName,confidence:result.confidence,nextPhoto:result.nextPhoto}));if(!passed)failed=true;}
if(failed)process.exitCode=1;
