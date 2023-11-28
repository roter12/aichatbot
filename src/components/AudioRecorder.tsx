import { Button } from "@nextui-org/react";
import React, { useEffect } from "react";
import { BiMicrophone } from "react-icons/bi";

interface IProps {
    onFinish: (audio: Blob) => Promise<any>;
    onRecordingStart?: () => void;
    duration_in_seconds: number;
}

const AudioRecorder: React.FC<IProps> = ({ onFinish, onRecordingStart, duration_in_seconds }) => {
    const [isRecording, setIsRecording] = React.useState<boolean>(false);

    const [stream, setStream] = React.useState<MediaStream | null>(null);
    const [voiceRecorder, setVoiceRecorder] =
        React.useState<MediaRecorder | null>(null);

    const [content, setContent] = React.useState<Blob | null>(null);

    useEffect(() => {
        setTimeout(() => {
            if (isRecording) {
                onStopRecording();
            }
        }, duration_in_seconds * 1000);
    }, [isRecording]);

    const onAudioClick = async () => {
        try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            const mediaRecorder = new MediaRecorder(audioStream);

            setStream(audioStream);
            setVoiceRecorder(mediaRecorder);
            setIsRecording(true);
            if (onRecordingStart) {
                onRecordingStart();
            }
        } catch (e) {
            console.log("User didn't allowed us to access the microphone.");
        }
    };

    const onStopRecording = () => {
        if (!isRecording || !stream || !voiceRecorder) return;

        const tracks = stream.getAudioTracks();

        for (const track of tracks) {
            track.stop();
        }

        voiceRecorder.stop();

        setVoiceRecorder(null);
        setIsRecording(false);
    };

    /**
     * This hook is triggered when we start the recording
     */
    React.useEffect(() => {
        if (!isRecording || !voiceRecorder) return;
        voiceRecorder.start();

        voiceRecorder.ondataavailable = ({ data }) => setContent(data);
    }, [isRecording, voiceRecorder]);

    /**
     * This hook will call our callback after finishing the record
     */
    React.useEffect(() => {
        if (isRecording || !content || !stream) return;

        onFinish(content)
            .then(() => {
                setStream(null);
                setContent(null);
            })

    }, [isRecording, content]);

    return (
        <Button
            disabled={isRecording}
            onClick={onAudioClick} >
            {!isRecording && content ? "Loading..." : <><BiMicrophone /> Record</>}
        </Button>
    );
};

export default AudioRecorder;
