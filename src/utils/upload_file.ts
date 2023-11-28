import generate_random_filename from "./generate_random_filename";
import aws from 'aws-sdk';
import fs from "fs";

const { DO_SPACES_NAME, DO_SPACES_ENDPOINT, DO_SPACES_KEY, DO_SPACES_SECRET } = process.env;

export default async function upload_file(path: string) {
    const content = fs.readFileSync(path);

    const spacesEndpoint = new aws.Endpoint(DO_SPACES_ENDPOINT!);
    const s3 = new aws.S3({ endpoint: spacesEndpoint, accessKeyId: DO_SPACES_KEY, secretAccessKey: DO_SPACES_SECRET });

    const extension = path.split(".").slice(-1)[0];
    const filename = generate_random_filename(extension);

    const params = {
        Bucket: DO_SPACES_NAME!,
        Key: filename,
        Body: content,
        ACL: "public-read"
    };

    await s3.upload(params).promise();
    return 'https://thehood.sfo3.cdn.digitaloceanspaces.com/' + filename;
}
