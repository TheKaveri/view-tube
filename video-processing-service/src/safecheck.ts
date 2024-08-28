// https://sightengine.com/docs/moderate-stored-video
// axios is asynchronous

require("dotenv").config();

import axios from "axios";
import FormData from "form-data";
import fs from "fs";

// returns true if video is explicit, false if video is safe.
export async function safecheck(inputFilePath: string) {
  let data = new FormData();
  data.append("media", fs.createReadStream(inputFilePath));
  // specify the models you want to apply
  data.append("models", "nudity-2.1");
  data.append("api_user", `${process.env.SIGHTENGINE_API_USER}`);
  data.append("api_secret", `${process.env.SIGHTENGINE_API_SECRET}`);

  const response = await axios({
    method: "post",
    url: "https://api.sightengine.com/1.0/video/check-sync.json",
    data: data,
    headers: data.getHeaders(),
  });

  response.data.data.frames.forEach((frame: any) => {
    const params = frame.nudity;

    const explicitContent = [
      params.sexual_activity,
      params.sexual_display,
      params.erotica,
      params.very_suggestive,
    ];

    if (Math.min(...explicitContent) > 0.5) {
      return true;
    }
  });
  return false;
}
