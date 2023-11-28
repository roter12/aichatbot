

export const Box = ({ children, className = "" }: { children?: any, className?: string }) => {
    className = className.includes("bg-") ? className : `bg-white ${className}`
    return <div className={`w-full py-4 px-5 rounded-[15px] border ${className}`}>
        {children}
    </div>
}

export const InnerBox = ({ children, className = "" }: { children?: any, className?: string }) => {
    return <Box className={`bg-[#FBFCFE] ${className}`}>
        {children}
    </Box>
}