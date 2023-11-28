export default function generate_random_filename(extension: string) {
    return Date.now() +
        Math.random().toString(36).substring(7) +
        Math.random().toString(36).substring(7) +
        Math.random().toString(36).substring(7)
        + "." + extension;
}