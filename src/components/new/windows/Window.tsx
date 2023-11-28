

const Window = ({ children, is_wide = false }: { children: any, is_wide?: boolean }) => {
    return <div className={`lg:bg-white p-10 text-center lg:rounded-[30px] ${is_wide ? "lg:w-[800px]" : "lg:w-[450px]"} lg:left-[50vw] lg:translate-x-[-50%] absolute lg:top-[50vh] lg:translate-y-[-50%] max-lg:left-0 max-lg:right-0 max-lg:bottom-0 max-lg:top-[0] max-lg:w-[100%] max-lg:h-[100vh]`}>
        {children}
    </div>
}

export default Window;