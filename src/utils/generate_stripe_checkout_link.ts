const NEXT_PUBLIC_API_PATH = process.env.NEXT_PUBLIC_API_PATH;

export default function generate_stripe_checkout_link(platform: "telegram" | "instagram", platform_chat_id: string, product: "subscription" | "deposit") {
    if (product === "deposit") {
        return (NEXT_PUBLIC_API_PATH + (NEXT_PUBLIC_API_PATH?.endsWith("/") ? "" : "/")).replace("/api/", "/")
            + `checkout?r=${platform_chat_id}`;
    } else {
        return NEXT_PUBLIC_API_PATH + (NEXT_PUBLIC_API_PATH?.endsWith("/") ? "" : "/")
            + `checkout?product=${product}&platform=${platform}&reference=${platform_chat_id}`;

    }
}