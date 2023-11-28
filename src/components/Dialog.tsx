import ReactDOM from 'react-dom';
import { Text } from '@nextui-org/react';
import { useEffect } from 'react';

const Dialog = ({ title, children, close, is_open }: { is_open: boolean; title: string; children: any; close: Function }) => {

    if (!is_open) {
        return <div></div>;
    }

    return ReactDOM.createPortal(
        <div className='fixed top-0 left-0 right-0 bottom-0 bg-black/50 z-[99999999]'
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    close();
                } 
            }}
        >
            <div className='bg-white p-10 rounded-[40px] fixed top-[50vh] left-[50vw] translate-x-[-50%] translate-y-[-50%] shadow-xl border w-[800px] max-w-[100vw] h-[600px]'>
               
                <div className='absolute top-3 right-3'>
                    <button onClick={() => close()}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className='mb-20'>
                    <Text
                        size={30}
                        css={{
                            textGradient: '45deg, $blue600 -20%, $pink600 50%'
                        }}
                    >
                        {title}
                    </Text>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
};

export default Dialog;