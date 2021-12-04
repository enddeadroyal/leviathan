export const textFilter = (value: string, operator: string, compare: string) => {
    switch(operator) {
        case "=":
            return value.trim() === compare.trim()
        case "contains":
            return value.trim().toLowerCase().includes(compare.trim().toLowerCase())
        case "start with":
            return value.trim().toLowerCase().startsWith(compare.trim().toLowerCase())
        case "end with":
            return value.trim().toLowerCase().endsWith(compare.trim().toLowerCase())
        default:
            return false
    }
}

export const ellipsis: (value: string, size: number) => string = (value, size) => value.length <= size? value: value.substr(0, size) + "..."