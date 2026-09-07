import { Cloudinary } from "@cloudinary/url-gen";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

export const cld = new Cloudinary({
  cloud: {
    cloudName,
  },
});
