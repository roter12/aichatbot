import wrap_api_function from "@/utils/wrap_api_function";
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function execute() {

    const min_created = 1692775968;

    const sessions = await stripe.checkout.sessions.list({
        limit: 100,
        // status: 'succeeded',
        // created: {
        //     gt: min_created
        // }
    });

    return sessions.data;
}

export default wrap_api_function(execute);