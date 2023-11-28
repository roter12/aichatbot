import wrap_api_function from "@/utils/wrap_api_function";
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function execute(body: any) {
    const { payment_intent } = body;

    const session = await stripe.checkout.sessions.list({
        limit: 1,
        payment_intent,
    });

    return session.data[0]?.id;
}

export default wrap_api_function(execute);