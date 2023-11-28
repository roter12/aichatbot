// import { query_open_ai } from "@/utils/query_open_ai";
// import wrap_api_function from "@/utils/wrap_api_function"

// const sentences_by_category = {
//     "rejections": [
//         "Thanks for the offer, but we've decided to go in a different direction.",
//         "I appreciate your time, but I don't think this software solution is the right fit for us.",
//         "We've decided to stick with our current insurance provider for now.",
//         "The apartment looks great, but I've decided to stay where I am."
//     ],
//     "objections": [
//         "I'm not convinced that your software has all the features we need.",
//         "I'm sorry, but the price for this apartment is just too high for what it offers.",
//         "I'm interested, but I've heard that claims processing is a hassle with your insurance company.",
//         "I appreciate your proposal, but I'm worried about the integration with our existing system."
//     ],
//     "questions_or_inquiries": [
//         "How does your software handle data security?",
//         "What is included in the maintenance fee for the apartment?",
//         "What kind of customer support do you provide for your insurance policies?",
//         "Can you explain the benefits of your product over the competitors?"
//     ],
//     "interest_or_engagement_signals": [
//         "This sounds like an interesting solution. Can you tell me more about how it would fit into our workflow?",
//         "I like the location of the apartment. Could we arrange another viewing?",
//         "The insurance plan you're suggesting sounds comprehensive. What are the next steps?",
//         "I see potential value in your product. Can you provide a detailed proposal?"
//     ],
//     "commitment_or_purchase_intent": [
//         "I'm convinced. Let's move forward with the software implementation.",
//         "The apartment ticks all our boxes. Let's proceed with the paperwork.",
//         "I'd like to go ahead with the insurance policy. Can you guide me through the process?",
//         "We're ready to get started. Can you draft a contract for us to review?"
//     ]
// }

// function shuffle(array: any[]) {
//     let currentIndex = array.length, randomIndex;
//     while (currentIndex != 0) {
//         randomIndex = Math.floor(Math.random() * currentIndex);
//         currentIndex--;
//         [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
//     }
//     return array;
// }

// async function execute() {

//     const category_by_sentence =
//         Object.entries(sentences_by_category)
//             .reduce((acc, [category, sentences]) => {
//                 sentences.forEach(sentence => {
//                     acc[sentence] = category;
//                 });
//                 return acc;
//             }, {} as Record<string, string>);

//     const data = shuffle(Object.keys(category_by_sentence));
//     console.log(data.map((line, index) => index + ": " + line).join("\n"))

//     for (const sentence of data) {
//         const is_classified_as_rejection = await query_open_ai([
//             {
//                 "role": "user",
//                 "content": "Is this a rejection or objection? Only say 'yes' or 'no'.\n\n" + sentence
//             }
//         ], "gpt-3.5-turbo-16k", api_key).then(response => {
//             response = response.toLowerCase();

//             if (!response.includes("yes") && !response.includes("no")) {
//                 if (!response.includes("objection") && !response.includes("rejection")) {
//                     console.log("Invalid response: " + response);
//                     return false;
//                 }
//                 return response.includes("objection") || response.includes("rejection");
//             }

//             return response.toLowerCase().includes("yes")
//         })
//         const category = category_by_sentence[sentence];
//         const is_actually_rejection = category === 'rejections' || category === 'objections';

//         if (is_actually_rejection !== is_classified_as_rejection) {
//             console.log(`\n${sentence}\n ${is_actually_rejection} ${is_classified_as_rejection}\n`);
//         } else {
//             console.log("\nCORRECT\n")
//         }
//     }

//     return data;
// }

// export default wrap_api_function(execute);