import { useEffect, useState } from "react"

export default function useStoredState<T>(key: string, defaultValue: any): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
    const [was_stored, set_was_stored] = useState<boolean>(false)

    const [value, setValue] = useState<T>(() => {
        const storedValue = localStorage.getItem(key)
        setTimeout(() => {
            set_was_stored(storedValue !== null)
        }, 70)
        return storedValue ? JSON.parse(storedValue) : defaultValue
    })

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value))
    }, [value])

    return [value, setValue, was_stored]
}