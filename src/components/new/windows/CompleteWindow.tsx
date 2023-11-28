import Button from "../Button";
import Window from "./Window";
import { Loading } from "@nextui-org/react";
import { useRouter } from "next/router";

const CompleteWindow = ({ is_complete }: { is_complete: boolean }) => {

    const router = useRouter();

    return <Window is_wide={true}>
        <div className="text-center">
            {
                is_complete
                    ? <>
                        <div className="text-2xl font-bold mb-4">🎉 Setup Complete!</div>
                        <div className="text-lg">Your AI is now training. This will take a few minutes.</div>
                        <Button className="mt-4" onClick={() => router.push("/charts")}>Go to Dashboard</Button>
                    </>
                    : <>
                        <div className="text-2xl font-bold mb-4">⏳ Saving ...</div>
                        <div className="text-lg"> Please wait while we save your data.</div>
                        <Loading className="mt-4" />
                    </>
            }

        </div>
    </Window>
}

export default CompleteWindow;