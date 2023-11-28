const LoadingScreen = ({ show }: { show: boolean }) => {
    if (!show) {
        return null;
    }
    return (
        <div className="flex justify-center items-center bg-black/90 top-0 left-0 right-0 bottom-0 fixed z-[300]">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white-900"></div>
        </div>
    );
};

export default LoadingScreen;
