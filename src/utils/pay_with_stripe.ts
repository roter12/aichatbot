export default async function pay_with_stripe(identifier: string, callback_url: string, account_id: string) {
    window.location.href = `/api/stripe_checkout?identifier=${identifier}&callback_url=${callback_url}&account_id=${account_id}`;
}