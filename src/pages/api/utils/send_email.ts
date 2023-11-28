
type Attachment = { url: string; name: string } | { name: string; content: string };

export default async function send_email(
    subject: string,
    content: string,
    to: string,
    options?: {
        attachment?: Attachment[];
        from?: string;
    }
) {
    let from = options?.from || 'noreply@example.org';
    let fromName = 'example.org';
    let toName = to;

    let response = await fetch('https://api.sendinblue.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': process.env.KEY_SENDINBLUE as string,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: {
                name: fromName,
                email: from
            },
            to: [
                {
                    email: to,
                    name: toName
                }
            ],
            subject: subject,
            htmlContent: content,
            attachment: options?.attachment
        })
    });

    await response.json().then(console.log);

    if (response.status !== 201 && response.status !== 200) {
        throw new Error('Error sending email');
    }
}
