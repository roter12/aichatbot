
import { Card as NextUICard, Text } from "@nextui-org/react";

export default function Card({ title, children }: { title: string, children: any }) {

    return <NextUICard style={{ padding: "30px", width: "400px" }}>
        <NextUICard.Header>
            <Text size={30} b>{title}</Text>
        </NextUICard.Header>
        <NextUICard.Body>
            {children}
        </NextUICard.Body>
    </NextUICard>
}