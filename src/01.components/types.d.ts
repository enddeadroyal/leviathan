export interface KeyValueParied {
    key: any,
    value: any,
}

export interface SelectPariedProps {
    data?: KeyValueParied,
    options?: KeyValueParied[],
    onChange?: (param?: any) => void,
}

export interface FilterItemProps {
    name: string,
    operate: string,
    value: any,
    checked: boolean,
    options?: KeyValueParied[],
    onChange?: (item: FilterItemProps) => void
}